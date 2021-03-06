import { __prod__ } from "./constants";
import { Post } from "./entities/post";
import { User } from "./entities/user";
import { MikroORM } from "@mikro-orm/core";
import path from "path";

export default {
  migrations: {
    path: path.join(__dirname, './migrations'), // path to the folder with migrations
    pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
  },
  entities: [Post, User],
  dbName: 'cruddit',
  type: 'postgresql',
  debug: !__prod__
} as Parameters<typeof MikroORM.init>[0]; // Returns an array of params expected by init function
