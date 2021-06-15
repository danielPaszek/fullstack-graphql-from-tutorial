import {
  FormControl,
  FormErrorMessage,
  FormLabel,
} from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Textarea } from "@chakra-ui/textarea";
import { useField } from "formik";
import React, { InputHTMLAttributes } from "react";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  isTextArea?: boolean;
};

const InputField: React.FC<InputFieldProps> = ({
  label,
  size: _,
  isTextArea,
  ...props
}) => {
  let C = Input;

  if (isTextArea) {
    //@ts-ignore
    C = Textarea;
  }
  const [field, { error }] = useField(props);
  return (
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{label}</FormLabel>
      <C {...field} {...props} id={field.name} />
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  );
};
export default InputField;
