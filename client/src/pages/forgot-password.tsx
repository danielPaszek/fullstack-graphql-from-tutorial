import { Box, Flex, Button, Link } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { NextPage } from "next";
import React, { useState } from "react";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { toErrormap } from "../utils/toErrorMap";
import NextLink from "next/link";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { useForgotPasswordMutation } from "../generated/graphql";

const ForgotPassword: NextPage = ({}) => {
  const [{}, forgotPassword] = useForgotPasswordMutation();
  const [completed, setCompleted] = useState(false);
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: "" }}
        onSubmit={async (values, actions) => {
          await forgotPassword(values);
          setCompleted(true);
        }}
      >
        {({ isSubmitting, handleSubmit }) =>
          completed ? (
            <Box>If your account exist, we sent you an email</Box>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Box mt={4}>
                <InputField
                  name="email"
                  placeholder="enter email"
                  label="Email"
                />
              </Box>
              <Button
                mx={4}
                type="submit"
                isLoading={isSubmitting}
                colorScheme="teal"
              >
                Reset Password
              </Button>
            </Form>
          )
        }
      </Formik>
    </Wrapper>
  );
};
export default withUrqlClient(createUrqlClient)(ForgotPassword);
