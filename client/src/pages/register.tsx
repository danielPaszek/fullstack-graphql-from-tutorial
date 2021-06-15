import { Button } from "@chakra-ui/button";
import { Box } from "@chakra-ui/layout";
import { Form, Formik } from "formik";
import React from "react";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { useRegisterMutation } from "../generated/graphql";
import { toErrormap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import { createUrqlClient } from "../utils/createUrqlClient";
import { withUrqlClient } from "next-urql";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
  const [{}, register] = useRegisterMutation();
  const router = useRouter();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{
          username: "",
          password: "",
          email: "",
          passwordReapeat: "",
        }}
        onSubmit={async (values, actions) => {
          if (values.password !== values.passwordReapeat) {
            actions.setErrors({
              password: "Passwords don't match",
            });
          }
          const response = await register(values);
          if (response.data?.register.errors) {
            actions.setErrors(toErrormap(response.data.register.errors));
          } else if (response.data?.register.user) {
            router.push("/");
          }
        }}
      >
        {({ isSubmitting, handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <Box>
              <InputField
                name="username"
                placeholder="enter username"
                label="Username"
              />
            </Box>
            <Box mt={4}>
              <InputField
                name="email"
                placeholder="enter email"
                label="Email"
              />
            </Box>
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="enter password"
                label="Password"
                type="password"
              />
            </Box>
            <Box mt={4}>
              <InputField
                name="passwordReapeat"
                placeholder="repeat password"
                label="Reapeat Password"
                type="password"
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};
export default withUrqlClient(createUrqlClient)(Register);
