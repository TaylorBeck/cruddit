import { User } from "../entities/User";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver
} from "type-graphql";
import argon2 from "argon2";

const DEFAULT_LOGIN_ERROR_MESSAGE: string = 'Username and/or Password do not match.';

@InputType() // Used for arguments
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@Resolver()
export class UserResolver {
  @Query(() => [User])
  users(@Ctx() { em }: MyContext): Promise<User[]> {
    return em.find(User, {});
  }

  @Query(() => User)
  user(
    @Arg('id', () => Int) id: number,
    @Ctx() { em }: MyContext
  ): Promise<User | null> {
    const user = em.findOne(User, { id });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('input') input: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    if (input.username.length <= 3) {
      return {
        errors: [{
          field: 'username',
          message: 'Username must have more than 3 characters'
        }]
      }
    }

    if (input.password.length <= 6) {
      return {
        errors: [{
          field: 'password',
          message: 'Password must have more than 6 characters'
        }]
      }
    }

    const hashedPassword = await argon2.hash(input.password);
    const user = em.create(User, {
      username: input.username,
      password: hashedPassword
    });

    try {
      await em.persistAndFlush(user);
    } catch(err) {
      if (err.code === '23505') {
        // Postgres: Duplicate Username Error (unique_violation)
        return {
          errors: [{
            field: 'username',
            message: 'That username is already taken'
          }]
        }
      }
    }

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('input') input: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: input.username });
    if (!user) {
      return {
        errors: [{
          field: 'username',
          message: DEFAULT_LOGIN_ERROR_MESSAGE
        }]
      }
    };

    const validLogin = await argon2.verify(user.password, input.password);
    if (!validLogin) {
      return {
        errors: [{
          field: 'password',
          message: DEFAULT_LOGIN_ERROR_MESSAGE
        }]
      }
    }

    return { user };
  }
}
