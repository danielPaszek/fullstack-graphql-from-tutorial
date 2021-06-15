import { Field, InputType } from "type-graphql";

@InputType()
export class UsernameEmailPasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
  @Field()
  email: string;
}
