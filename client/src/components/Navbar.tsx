import { Box, Flex, Heading, Link } from "@chakra-ui/layout";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { Button } from "@chakra-ui/button";
import { useRouter } from "next/router";
interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = ({}) => {
  const router = useRouter();
  const [{ data, fetching }] = useMeQuery();
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  let body = null;
  if (fetching) {
    //loading
  } else if (!data?.me) {
    //not logged in
    body = (
      <>
        <NextLink href="/login">
          <Link color="white" mr={2}>
            login
          </Link>
        </NextLink>
        <NextLink href="/register">
          <Link color="white" mr={2}>
            register
          </Link>
        </NextLink>
      </>
    );
  } else {
    //logged in
    body = (
      <Flex>
        <Box mr={2}>{data.me.username}</Box>
        <Button
          onClick={async () => {
            await logout();
            router.reload();
          }}
          isLoading={logoutFetching}
          variant="link"
        >
          logout
        </Button>
      </Flex>
    );
  }
  return (
    <Flex
      position="sticky"
      top={0}
      zIndex={10}
      bg="tomato"
      p={4}
      align="center"
    >
      <NextLink href="/">
        <Link>
          <Heading>LiReddit</Heading>
        </Link>
      </NextLink>
      <Box ml="auto">{body}</Box>
    </Flex>
  );
};
export default Navbar;
