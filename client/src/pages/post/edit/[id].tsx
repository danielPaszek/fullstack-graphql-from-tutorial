import { Box, Flex, Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import InputField from "../../../components/InputField";
import Layout from "../../../components/Layout";
import {
  usePostQuery,
  useUpdatePostMutation,
} from "../../../generated/graphql";
import { createUrqlClient } from "../../../utils/createUrqlClient";

const EditPost: React.FC = ({}) => {
  const router = useRouter();
  const intId =
    typeof router.query.id === "string" ? Number(router.query.id) : -1;
  const [{ data }] = usePostQuery({
    pause: intId === -1,
    variables: { id: Number(router.query.id) },
  });
  console.log("data", data);
  const [{}, updatePost] = useUpdatePostMutation();
  if (!data) {
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    );
  }
  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: data?.post?.title, text: data?.post?.text }}
        onSubmit={async (values, actions) => {
          //   await createPost({ options: values });
          //   router.push("/");
          await updatePost({
            id: intId,
            text: values.text!,
            title: values.title!,
          });
          console.log("id", intId);
          console.log("values", values);
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
                Update Post
              </Button>
            </Flex>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};
export default withUrqlClient(createUrqlClient)(EditPost);
