import { Post } from "../entities/Post";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Updoot } from "../entities/Updoot";

@InputType()
export class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 75) + "...";
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const realValue = value !== -1 ? 1 : -1;
    const userId = Number(req.session.userId);
    const column = realValue === 1 ? "upvotes" : "downvotes";
    const secondCol = column === "upvotes" ? "downvotes" : "upvotes";
    const updoot = await Updoot.findOne({ where: { postId, userId } });

    if (updoot && updoot.vote !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
        update updoot 
        set vote = $1
        where "postId" = $2 and "userId" = $3
        `,
          [realValue, postId, userId]
        );
        await tm.query(
          `
      update post
      set ${column} = ${column} + 1,
      ${secondCol} = ${secondCol} -1
      where id = $1;
        `,
          [postId]
        );
      });
    } else if (!updoot) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
          insert into updoot ("userId", "postId", vote)
          values($1,$2,$3)
        `,
          [userId, postId, realValue]
        );
        await tm.query(
          `
          update post 
          set ${column} = ${column} + 1
          where id = $1
        `,
          [postId]
        );
      });
    }
    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(30, limit);
    const realLimitPlusOne = realLimit + 1;
    const args: any[] = [realLimitPlusOne];
    if (cursor) args.push(new Date(parseInt(cursor)));
    const posts = await getConnection().query(
      `
      select p.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email
        ) creator,
      ${
        req.session.userId
          ? `(select vote from updoot where "userId" = ${req.session.userId} and "postId" = p.id) "voteStatus"`
          : `null as "voteStatus"`
      }
      from post p
      inner join public.user u on u.id = p."creatorId"
      ${cursor ? 'where p."createdAt" < $2' : ""}
      order by p."createdAt" DESC
      limit $1
    `,
      args
    );
    //console.log("posts", posts);
    return {
      posts: posts.slice(0, realLimitPlusOne),
      hasMore: posts.length === realLimitPlusOne,
    };
  }
  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id, { relations: ["creator"] });
  }
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("options") options: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...options,
      creatorId: Number(req.session.userId),
    }).save();
  }
  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    console.log("runing!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    const post = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ text, title })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();
    return post.raw[0];
  }
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    await Post.delete({ id, creatorId: Number(req.session.userId) });
    return true;
  }
}
