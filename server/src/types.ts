import { Request, Response } from "express";
import { Session } from "express-session";
import { Redis } from "ioredis";

declare module "express-session" {
  interface Session {
    userId: string;
  }
}

export type MyContext = {
  req: Request & { session: Session };
  res: Response;
  redis: Redis;
};
