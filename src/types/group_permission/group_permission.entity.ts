import { Field, ObjectType } from "@nestjs/graphql";
import { IsBoolean, IsObject, MaxLength } from "class-validator";
import { GroupPermission as PrismaGroupPermission, Prisma } from "@prisma/client";
import { GraphQLBigInt, GraphQLJSON } from "graphql-scalars";
import { BigIntMin } from "../../custom-validators";

@ObjectType()
export class GroupPermission implements PrismaGroupPermission {
    /**
     * CASL "modelName" used for detecting subject type. Only necessary when the string "GroupPermission" is passed to CASL's
     *   can() method, and the passed GroupPermission object hasn't passed through the subject() helper function.
     * @see {@link https://casl.js.org/v6/en/advanced/typescript}
     */
    static readonly modelName = "GroupPermission" as const;

    /**
     * Unique ID for this GroupPermission. Automatically generated.
     */
    @BigIntMin(0)
    @Field(() => GraphQLBigInt, { nullable: true })
    id: bigint | null;

    /**
     * ID of the group which this GroupPermission is for.
     */
    @BigIntMin(0)
    @Field(() => GraphQLBigInt, { nullable: true })
    groupId: bigint | null;

    /**
     * The action for this GroupPermission. Should be a valid action within {@link AbilityAction}.
     * @see {@link https://casl.js.org/v6/en/guide/intro}
     */
    @MaxLength(100)
    @Field(() => String, { nullable: true })
    action: string | null;

    /**
     * The set of subjects for this GroupPermission. Should be all valid subjects within {@link AbilitySubjects}.
     * @see {@link https://casl.js.org/v6/en/guide/intro}
     */
    @MaxLength(300, { each: true })
    @Field(() => [String], { nullable: true })
    subject: string[] | null;

    /**
     * The set of fields for this GroupPermission.
     * @see {@link https://casl.js.org/v6/en/guide/intro}
     */
    @MaxLength(100, { each: true })
    @Field(() => [String], { nullable: true })
    fields: string[] | null;

    /**
     * Any conditional checks for this GroupPermission.
     * @see {@link https://casl.js.org/v6/en/guide/intro}
     */
    @IsObject()
    @Field(() => GraphQLJSON, { nullable: true })
    conditions: Prisma.JsonValue | null;

    /**
     * True if this GroupPermission is a denying permission. False if this GroupPermission is an allowing permission.
     * @see {@link https://casl.js.org/v6/en/guide/intro}
     */
    @IsBoolean()
    @Field(() => Boolean, { nullable: true })
    inverted: boolean | null;

    /**
     * The reason for this GroupPermission if this GroupPermission has {@link #inverted} equal to true.
     * @see {@link https://casl.js.org/v6/en/guide/intro}
     */
    @MaxLength(300)
    @Field(() => String, { nullable: true })
    reason: string | null;
}
