import { User } from "../entities/User";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import argon2 from "argon2";
import { UsernameEmailPasswordInput } from "../utils/UsernameEmailPasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { FORGET_PASSWD_PREFIX } from "../constants";
import { getConnection } from "typeorm";

@InputType()
class UsernameOrEmailInput {
  @Field()
  usernameOrEmail?: string;
  @Field()
  password: string;
}
@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    //it's ok to show user his own email
    if (Number(req.session.userId) === user.id) {
      return user.email;
    }
    return "";
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) return undefined;
    return User.findOne(Number(req.session.userId));
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("newPassword") newPassword: string,
    @Arg("token") token: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 3) {
      return {
        errors: [
          {
            field: "NewPassword",
            message: "password length must be at least 4 characters long",
          },
        ],
      };
    }
    const key = FORGET_PASSWD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token has expired",
          },
        ],
      };
    }
    const user = await User.findOne(Number(userId));
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user probably no longer exist",
          },
        ],
      };
    }
    await User.update(
      { id: Number(userId) },
      {
        password: await argon2.hash(newPassword),
      }
    );
    await redis.del(key);
    //login after this
    req.session.userId = String(user.id);

    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Ctx() { redis }: MyContext,
    @Arg("email") email: string
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) return true;

    const token = v4();

    await redis.set(
      FORGET_PASSWD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 * 7
    );
    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">RESET PASSWORD</a>`
    );
    return true;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernameEmailPasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }
    const hashed = await argon2.hash(options.password);
    let user;

    //using queryBuilder instead of orm
    try {
      //using query builder, but User.create().save() also works
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          password: hashed,
          email: options.email,
        })
        .returning("*")
        .execute();
      user = result.raw[0];
    } catch (err) {
      if (err.detail.includes("already exists")) {
        return {
          errors: [
            {
              field: "username",
              message: "username or email is already taken",
            },
          ],
        };
      }
    }
    req.session.userId = String(user.id);
    return {
      user,
    };
  }
  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernameOrEmailInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const isUsername = !options.usernameOrEmail?.includes("@");
    let user;
    if (isUsername)
      user = await User.findOne({
        where: { username: options.usernameOrEmail },
      });
    else {
      user = await User.findOne({ where: { email: options.usernameOrEmail } });
    }
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "user doesn't exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }
    req.session.userId = String(user.id);
    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((res1) => {
      req.session.destroy((err) => {
        res.clearCookie("token");
        if (err) {
          console.log(err);
          res1(false);
          return;
        }
        res1(true);
      });
    });
  }
}
