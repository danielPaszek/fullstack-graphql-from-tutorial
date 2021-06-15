import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import React, { useState } from "react";
import { PostSnippetFragment, useVoteMutation } from "../generated/graphql";

interface UpvoteSectionProps {
  post: PostSnippetFragment;
}
//
const UpvoteSection: React.FC<UpvoteSectionProps> = ({ post }) => {
  // console.log("post", post);
  const [{ data }, vote] = useVoteMutation();
  const [loadingState, setLoadingState] =
    useState<"up-loading" | "down-loading" | "not-loading">("not-loading");
  return (
    <Flex direction="column" align="center" justify="center" mr="4">
      <IconButton
        aria-label="upvote"
        size="sm"
        icon={<ChevronUpIcon />}
        isLoading={loadingState === "up-loading"}
        colorScheme={post.voteStatus === 1 ? "green" : undefined}
        onClick={async () => {
          if (post.voteStatus === 1) return;
          setLoadingState("up-loading");
          await vote({
            postId: post.id,
            value: 1,
          });
          setLoadingState("not-loading");
        }}
      />
      <p>{post?.upvotes}</p>
      <p>{post?.downvotes}</p>

      <IconButton
        aria-label="downvote"
        size="sm"
        icon={<ChevronDownIcon />}
        isLoading={loadingState === "down-loading"}
        colorScheme={post.voteStatus === -1 ? "red" : undefined}
        onClick={async () => {
          if (post.voteStatus === -1) return;
          setLoadingState("down-loading");
          await vote({
            postId: post.id,
            value: -1,
          });
          setLoadingState("not-loading");
        }}
      />
    </Flex>
  );
};
export default UpvoteSection;
