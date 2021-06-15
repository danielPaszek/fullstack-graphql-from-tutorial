import { dedupExchange, fetchExchange, gql, stringifyVariables } from "urql";
import {
  LogoutMutation,
  MeQuery,
  MeDocument,
  LoginMutation,
  RegisterMutation,
  VoteMutationVariables,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import { Cache, cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { isServer } from "./isServer";

export const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }
    const isInCache = cache.resolve(entityKey, fieldName, fieldArgs);
    // should I fetch more data
    info.partial = !isInCache;
    const results: string[] = [];
    let hasMore = true;
    fieldInfos.forEach((fi) => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, "posts") as string[];
      const _hasMore = !!cache.resolve(key, "hasMore");
      if (!_hasMore) hasMore = _hasMore;
      results.push(...data);
    });
    return {
      __typename: "PaginatedPosts",
      posts: results,
      hasMore,
    };
  };
};

const invalidateAllPosts = (cache: Cache) => {
  const allFields = cache.inspectFields("Query");
  const fieldInfos = allFields.filter((info) => info.fieldName === "posts");
  fieldInfos.forEach((fi) => {
    cache.invalidate("Query", "posts", fi.arguments);
  });
};

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = "";
  if (isServer()) {
    cookie = ctx?.req?.headers?.cookie;
  }
  return {
    url: "http://localhost:4000/graphql",
    fetchOptions: {
      credentials: "include" as const,
      headers: cookie ? { cookie } : undefined,
    },
    exchanges: [
      dedupExchange,
      cacheExchange({
        keys: {
          PaginatedPosts: () => null,
        },
        resolvers: {
          Query: {
            posts: cursorPagination(),
          },
        },
        updates: {
          Mutation: {
            deletePost: (result1, args, cache, info) => {
              cache.invalidate({ __typename: "Post", id: (args as any).id });
            },

            //use fragments instead of returning post and updating them
            vote: (result1, args, cache, info) => {
              const { postId, value } = args as VoteMutationVariables;
              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    id
                    upvotes
                    downvotes
                    voteStatus
                  }
                `,
                { id: postId }
              );
              if (data) {
                if (data.voteStatus === value) return;
                const change = !data.voteStatus ? 0 : 1;
                let newUpvotes, newDownvotes;
                if (value === 1) {
                  newUpvotes = data.upvotes + 1;
                  newDownvotes = data.downvotes - change;
                } else {
                  newUpvotes = data.upvotes - change;
                  newDownvotes = data.downvotes + 1;
                }
                cache.writeFragment(
                  gql`
                    fragment __ on Post {
                      upvotes
                      downvotes
                      voteStatus
                    }
                  `,
                  {
                    id: postId,
                    upvotes: newUpvotes,
                    downvotes: newDownvotes,
                    voteStatus: value,
                  }
                );
              }
            },
            createPost: (result1, args, cache, info) => {
              invalidateAllPosts(cache);
            },

            logout: (result1, args, cache, info) => {
              betterUpdateQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                result1,
                () => ({ me: null })
              );
            },
            login: (result1, args, cache, info) => {
              betterUpdateQuery<LoginMutation, MeQuery>(
                cache,
                { query: MeDocument },
                result1,
                (result, query) => {
                  if (result.login.errors) {
                    return query;
                  } else {
                    return {
                      me: result.login.user,
                    };
                  }
                }
              );
              invalidateAllPosts(cache);
            },
            register: (result1, args, cache, info) => {
              betterUpdateQuery<RegisterMutation, MeQuery>(
                cache,
                { query: MeDocument },
                result1,
                (result, query) => {
                  if (result.register.errors) {
                    return query;
                  } else {
                    return {
                      me: result.register.user,
                    };
                  }
                }
              );
            },
          },
        },
      }),
      ssrExchange,
      fetchExchange,
    ],
  };
};
