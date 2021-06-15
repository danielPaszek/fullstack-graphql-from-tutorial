import { Button } from "@chakra-ui/button";
import { Box, Flex, Link } from "@chakra-ui/layout";
import { Form, Formik } from "formik";
import React from "react";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { useLoginMutation } from "../generated/graphql";
import { toErrormap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";

const Login: React.FC<{}> = ({}) => {
  const [{}, login] = useLoginMutation();
  const router = useRouter();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ usernameOrEmail: "", password: "" }}
        onSubmit={async (values, actions) => {
          const response = await login(values);
          if (response.data?.login.errors) {
            actions.setErrors(toErrormap(response.data.login.errors));
          } else if (response.data?.login.user) {
            router.push((router.query.next as string) || "/");
          }
        }}
      >
        {({ isSubmitting, handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <InputField
              name="usernameOrEmail"
              placeholder="enter username or email"
              label="Username or Email"
            />
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="enter password"
                label="Password"
                type="password"
              />
            </Box>
            <Flex justify="space-between" align="center" my={4}>
              <Button
                mx={4}
                type="submit"
                isLoading={isSubmitting}
                colorScheme="teal"
              >
                Login
              </Button>
              <NextLink href="/forgot-password">
                <Link>forgot password?</Link>
              </NextLink>
            </Flex>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};
export default withUrqlClient(createUrqlClient)(Login);
