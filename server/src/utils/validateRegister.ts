import { validate } from "email-validator";
import { UsernameEmailPasswordInput } from "./UsernameEmailPasswordInput";

export const validateRegister = (options: UsernameEmailPasswordInput) => {
  if (!validate(options.email)) {
    return [
      {
        field: "email",
        message: "Invalid email",
      },
    ];
  }
  if (options.username.length <= 2) {
    return [
      {
        field: "username",
        message: "length must be greater than 2",
      },
    ];
  }
  if (options.username.includes("@")) {
    return [
      {
        field: "username",
        message: "cannot include @",
      },
    ];
  }
  if (options.username.length > 25) {
    return [
      {
        field: "username",
        message: "too long username",
      },
    ];
  }
  if (options.password.length <= 3) {
    return [
      {
        field: "password",
        message: "password length must be at least 4 characters long",
      },
    ];
  }
  return null;
};
