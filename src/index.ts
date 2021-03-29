import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { __prod__ } from "./constants";
import mikroOrmConfig from "./mikro-orm.config";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/user";
import { PostResolver } from "./resolvers/post";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig); // Connect to database
  // Run migrations, MikroORM will compare any entity updates to the database 
  await orm.getMigrator().up();
  
  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false
    }),
    context: () => ({ em: orm.em })
  });

  apolloServer.applyMiddleware({ app }); // Establish graphql endpoint

  app.get('/', (_, res) => {
    console.log(res);
    res.send('Homepage');
  });
  app.listen(4000, () => {
    console.log('( ͡° ͜ʖ ͡°) Server started on localhost:4000');
  });
}

main().catch(err => {
  console.error(err);
});
