import { Box, Heading } from "@chakra-ui/layout";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import Layout from "../../components/Layout";
import { usePostQuery } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";

interface Props {}

const Post: React.FC<Props> = ({}) => {
  const router = useRouter();
  const intId =
    typeof router.query.id === "string" ? Number(router.query.id) : -1;
  const [{ data }] = usePostQuery({
    pause: intId === -1,
    variables: {
      id: intId,
    },
  });
  if (!data?.post)
    return (
      <Layout>
        <Box>Could not find the post</Box>
      </Layout>
    );
  return (
    <Layout>
      <Heading>{data?.post?.title}</Heading>
      <Box>{data?.post?.text}</Box>
    </Layout>
  );
};
export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
