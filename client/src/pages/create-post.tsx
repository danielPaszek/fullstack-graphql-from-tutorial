import { Box, Button, Flex } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import InputField from "../components/InputField";
import Layout from "../components/Layout";
import { useCreatePostMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { useIsAuth } from "../utils/useIsAuth";

const CreatePost: React.FC<{}> = ({}) => {
  const [{}, createPost] = useCreatePostMutation();
  const router = useRouter();
  useIsAuth();

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values, actions) => {
          await createPost({ options: values });
          router.push("/");
        }}
      >
        {({ isSubmitting, handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <InputField name="title" placeholder="title" label="Title" />
            <Box mt={4}>
              <InputField
                isTextArea
                name="text"
                placeholder="text..."
                label="Body"
              />
            </Box>
            <Flex justify="center" align="center">
              <Button
                mt={4}
                type="submit"
                isLoading={isSubmitting}
                colorScheme="teal"
              >
                Create Post
              </Button>
            </Flex>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};
export default withUrqlClient(createUrqlClient)(CreatePost);
