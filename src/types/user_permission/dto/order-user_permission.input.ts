import { InputType, registerEnumType } from "@nestjs/graphql";
import { OrderDirection } from "../../../gql/order-direction.enum";

enum UserPermissionOrderableFields {
    id = "id",
    action = "action"
}

registerEnumType(UserPermissionOrderableFields, {
    name: "UserPermissionOrderableFields"
});

/**
 * Input type for ordering UserPermissions in ReadMany queries.
 */
@InputType()
export class OrderUserPermissionInput {
    /**
     * Name of the field to sort by.
     */
    field: UserPermissionOrderableFields;
    /**
     * Direction to order in. Required.
     */
    direction: OrderDirection;
}
