import { User } from "../entities/User";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver
} from "type-graphql";
import argon2 from "argon2";

@InputType()
class RegistrationInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@Resolver()
export class UserResolver {
  @Mutation(() => User)
  async register(
    @Arg('input') input: RegistrationInput,
    @Ctx() { em }: MyContext
  ): Promise<User> {
    const hashedPassword = await argon2.hash(input.password);
    const user = em.create(User, {
      username: input.username,
      password: hashedPassword
    });
    await em.persistAndFlush(user);
    return user;
  }

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
}
