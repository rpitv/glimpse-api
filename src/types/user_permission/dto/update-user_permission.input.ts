import { CreateUserPermissionInput } from "./create-user_permission.input";
import { InputType, PartialType } from "@nestjs/graphql";

/**
 * Input type for updateUserPermission mutation. Null values are not updated. To update a non-null value to null, explicitly
 *  pass null.
 */
@InputType()
export class UpdateUserPermissionInput extends PartialType(CreateUserPermissionInput) {}
