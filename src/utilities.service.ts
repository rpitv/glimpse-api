import { Injectable } from "@nestjs/common";
import { CreateUserPermissionInput } from "./types/user_permission/dto/create-user_permission.input";
import { CreateGroupPermissionInput } from "./types/group_permission/dto/create-group_permission.input";
import { UpdateUserPermissionInput } from "./types/user_permission/dto/update-user_permission.input";
import { UpdateGroupPermissionInput } from "./types/group_permission/dto/update-group_permission.input";
import { Prisma } from "@prisma/client";

type OperatorValues = "string" | "number" | "boolean" | "date" | "string[]" | "number[]" | "null";

@Injectable()
export class UtilitiesService {
    private readonly variableTypes: Record<string, OperatorValues> = {
        $id: "number",
        $groups: "number[]",
        $now: "date"
    };
    private readonly operators: Record<string, OperatorValues[]> = {
        equals: ["string", "number", "boolean", "date", "null"],
        not: ["string", "number", "boolean", "date", "null"],
        gt: ["number", "date"],
        gte: ["number", "date"],
        lt: ["number", "date"],
        lte: ["number", "date"],
        in: ["string[]", "number[]"],
        contains: ["string"],
        startsWith: ["string"],
        endsWith: ["string"]
    };

    /**
     * Performs sanitization on a permission input object. This includes:
     *  - Converting null conditions to DbNull
     *  - Converting empty fields arrays to null
     *  - Validating the condition syntax, and throwing an error if it is invalid
     * @param input Permission input object to sanitize
     * @returns The sanitized permission input object
     * @throws Error if the permission condition syntax is invalid
     */
    public sanitizePermissionInput<
        T extends
            | CreateUserPermissionInput
            | CreateGroupPermissionInput
            | UpdateUserPermissionInput
            | UpdateGroupPermissionInput
    >(input: T): T {
        // null == undefined, but null !== undefined
        if (input.conditions != null) {
            this.validateConditionSyntax(input.conditions);
        }

        // See: https://github.com/prisma/prisma/issues/9264#issuecomment-923310191
        if (input.conditions === null) {
            input.conditions = Prisma.DbNull as any;
        }

        return input;
    }

    /**
     * Validates the syntax of a condition object. Throws an error if the condition is invalid. Returns void if the
     *  condition is valid.
     * @param condition Condition value to check the syntax of.
     * @throws Error if the condition is not a valid condition object
     */
    private validateConditionSyntax(condition: unknown): void {
        if (typeof condition !== "object") {
            throw new Error("Condition must be an object");
        }

        for (const [fieldKey, fieldValue] of Object.entries(condition)) {
            if (["AND", "OR", "NOT"].includes(fieldKey)) {
                this.validateConditionSyntax(fieldValue);
                continue;
            }

            for (const [opKey, opValue] of Object.entries(fieldValue)) {
                this.validateOperatorValue(opKey, opValue);
            }
        }
    }

    /**
     * Checks whether the given value can be used with the given operator. If not, an error is thrown. Otherwise, void is
     *  returned. For example, the 'in' operator can only be used with string and number arrays, so if the value is a
     *  boolean, an error is thrown.
     * @param operator
     * @param value
     * @see operators for where it is defined which operators can be used with which value types
     */
    private validateOperatorValue(operator: string, value: unknown) {
        if (operator === "mode") {
            if (value !== "Insensitive" && value !== "Default") {
                throw new Error('`mode` must be either "Insensitive" or "Default"');
            }
        }
        if (this.operators[operator] === undefined) {
            throw new Error(`Unknown operator: \`${operator}\``);
        }

        let valueType: OperatorValues;
        switch (typeof value) {
            case "number":
            case "boolean":
                valueType = typeof value as "number" | "boolean";
                break;
            case "string":
                valueType = "string";
                if (!isNaN(new Date(value as string).getTime())) {
                    valueType = "date";
                } else if (value.startsWith("$")) {
                    valueType = this.variableTypes[value];
                }
                if (valueType === undefined) {
                    throw new Error(`Unknown variable: \`${value}\``);
                }
                break;
            case "object":
                if (value === null) {
                    valueType = "null";
                } else if (Array.isArray(value)) {
                    if (value.length === 0) {
                        throw new Error("Arrays cannot be empty");
                    }
                    const firstValueType = typeof value[0];
                    if (firstValueType !== "string" && firstValueType !== "number") {
                        throw new Error("Arrays can only contain strings or numbers");
                    }
                    for (const v of value) {
                        if (typeof v !== firstValueType) {
                            throw new Error("Arrays must contain all the same type of value");
                        }
                    }
                    valueType = (firstValueType + "[]") as "string[]" | "number[]";
                }
                throw new Error(`Operator \`${operator}\` cannot be used with value of type \`${typeof value}\``);
                // noinspection UnreachableCodeJS
                break;
            case "undefined":
            case "bigint":
            case "symbol":
            case "function":
            default:
                throw new Error(`Operator \`${operator}\` cannot be used with value of type \`${typeof value}\``);
        }

        if (!this.operators[operator].includes(valueType)) {
            throw new Error(`Operator \`${operator}\` cannot be used with value of type \`${valueType}\``);
        }
    }
}
