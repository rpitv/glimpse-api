import { InputType, registerEnumType } from "@nestjs/graphql";
import { OrderDirection } from "../../../gql/order-direction.enum";

enum ProductionRSVPOrderableFields {
    id = "id",
    willAttend = "willAttend"
}

registerEnumType(ProductionRSVPOrderableFields, {
    name: "ProductionRSVPOrderableFields"
});

/**
 * Input type for ordering ProductionRSVPs in ReadMany queries.
 */
@InputType()
export class OrderProductionRSVPInput {
    /**
     * Name of the field to sort by.
     */
    field: ProductionRSVPOrderableFields;
    /**
     * Direction to order in. Required.
     */
    direction: OrderDirection;
}
