import { Box, Button, Link } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React, { useState } from "react";
import InputField from "../../components/InputField";
import Wrapper from "../../components/Wrapper";
import { useChangePasswordMutation } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { toErrormap } from "../../utils/toErrorMap";
import NextLink from "next/link";

const ChangePassword: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const _token = token as string;
  const [{}, changePassword] = useChangePasswordMutation();
  const [tokenError, setTokenError] = useState("");
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ newPassword: "", newPasswordReapeat: "" }}
        onSubmit={async (values, actions) => {
          if (values.newPassword !== values.newPasswordReapeat) {
            actions.setErrors({
              newPassword: "Passwords don't match",
            });
          }
          const response = await changePassword({
            newPassword: values.newPassword,
            token: _token,
          });
          if (response.data?.changePassword.errors) {
            const errorMap = toErrormap(response.data.changePassword.errors);
            if ("token" in errorMap) {
              setTokenError(errorMap.token);
            }
            actions.setErrors(errorMap);
          } else if (response.data?.changePassword.user) {
            router.push("/");
          }
        }}
      >
        {({ isSubmitting, handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <InputField
              name="newPassword"
              placeholder="enter new password"
              label="New Password"
              type="password"
            />
            {tokenError && (
              <Box>
                <Box color="red.500">{tokenError}</Box>
                <NextLink href="/forgot-password">
                  <Link>go to forgot-password page</Link>
                </NextLink>
              </Box>
            )}
            <Box mt={4}>
              <InputField
                name="newPasswordReapeat"
                placeholder="repeat password"
                label="Repeat Password"
                type="password"
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              Change Password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(ChangePassword);
