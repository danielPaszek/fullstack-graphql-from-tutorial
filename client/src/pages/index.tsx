import { Box, Flex, Heading, Link, Stack, Text } from "@chakra-ui/layout";
import { withUrqlClient } from "next-urql";
import Layout from "../components/Layout";
import {
  useDeletePostMutation,
  useMeQuery,
  usePostsQuery,
} from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";
import { Button, IconButton } from "@chakra-ui/button";
import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DeleteIcon,
  EditIcon,
} from "@chakra-ui/icons";
import UpvoteSection from "../components/UpvoteSection";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as null | string,
  });
  const [{ data: meData }] = useMeQuery();
  const [{ data, fetching }, postsQuery] = usePostsQuery({
    variables,
  });
  const [{}, deletePost] = useDeletePostMutation();
  if (!data && !fetching)
    return <div>something went wrong. Please refresh page</div>;
  return (
    <Layout>
      <Flex my={4} justify="space-between" align="center">
        <Heading>Lireddit</Heading>
        <NextLink href="/create-post">
          <Link>create post</Link>
        </NextLink>
      </Flex>
      {fetching && !data ? (
        <div>LOADING...</div>
      ) : (
        <Stack spacing={8}>
          {data?.posts.posts.map((el) => (
            <Flex
              p={5}
              shadow="md"
              borderWidth="1px"
              borderRadius="md"
              key={el.id}
            >
              <UpvoteSection post={el} />
              <Box flex="1">
                <NextLink href="/post/[id]" as={`/post/${el.id}`}>
                  <Link>
                    <Heading fontSize="xl">{el.title}</Heading>
                  </Link>
                </NextLink>
                <Text>posted by {el.creator.username}</Text>
                <Flex>
                  <Text flex="1" mt={4}>
                    {el.textSnippet}
                  </Text>
                  {meData?.me?.id === el.creator.id && (
                    <Box>
                      <IconButton
                        mr={2}
                        aria-label="delete"
                        icon={<DeleteIcon />}
                        onClick={() => {
                          deletePost({ id: el.id });
                        }}
                      />
                      <NextLink
                        href="/post/edit/[id]"
                        as={`/post/edit/${el.id}`}
                      >
                        <IconButton
                          as={Link}
                          aria-label="update"
                          icon={<EditIcon />}
                          onClick={() => {}}
                        />
                      </NextLink>
                    </Box>
                  )}
                </Flex>
              </Box>
            </Flex>
          ))}
        </Stack>
      )}
      {data && data.posts.hasMore && (
        <Flex>
          <Button
            onClick={() =>
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              })
            }
            isLoading={fetching}
            mx="auto"
            my="8"
          >
            Load More
          </Button>
        </Flex>
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
