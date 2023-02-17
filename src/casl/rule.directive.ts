import { DirectiveLocation, getDirective, MapperKind, mapSchema } from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLNonNull, GraphQLSchema } from "graphql";
import {
    GraphQLBoolean,
    GraphQLDirective,
    GraphQLEnumType,
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLString
} from "graphql/type";
import { RuleDef, RuleFn, RuleType } from "./rule.decorator";
import { AbilityAction, GraphQLAbilitySubjectsType } from "./casl-ability.factory";
import { CaslHelper } from "./casl.helper";
import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { defer, firstValueFrom, map, Observable, tap } from "rxjs";
import { GraphQLResolverArgs } from "../gql/graphql-resolver-args.class";
import { subject } from "@casl/ability";

/**
 * Injectable class for defining a GraphQL directive that can be used to apply CASL rules to a field. This directive
 *  operates almost identically to the @{@link Rule}() decorator, but is intended to be used in a GraphQL schema.
 *  The {@link Rule} decorator cannot be used in a GraphQL context as NestJS interceptors are only capable of
 *  encapsulating top-level resolver functions.
 *
 *  Currently, custom rule types are not supported by this directive.
 *
 *  @see {@link Rule} for HTTP counterpart and full documentation.
 *  @see {@link https://github.com/nestjs/graphql/issues/631}
 */
@Injectable()
export class RuleDirective {
    private logger: Logger = new Logger("RuleDirective");

    constructor(private readonly caslHelper: CaslHelper) {}

    private customRules: Record<string, RuleFn> = {
        permissionsFor: (ctx, rule, handler) => {
            this.logger.verbose("permissionsFor custom rule handler called");
            const req = this.caslHelper.getRequest(ctx);
            const fields = this.caslHelper.getSelectedFields(ctx);

            const selectedFields: Record<"UserPermission" | "GroupPermission", string[]> = {
                UserPermission: [],
                GroupPermission: []
            };

            // Sanitize the fields to ensure that only the fields that are actually selected are checked. Then,
            //  check if the user has the ability to read the field. Sanitization simplifies later checks.
            for (const fieldAndType of fields) {
                const split = fieldAndType.split(".", 2);
                const type = split[0];
                const field = split[1];

                // This should only be __typename.
                if (type === "Permission") {
                    if (field === "__typename") {
                        continue;
                    }
                    throw new Error(`Unexpected field in permissionsFor custom rule: ${type}.${field}`);
                }

                if (type !== "GroupPermission" && type !== "UserPermission") {
                    throw new Error("Unexpected type in permissionsFor custom rule: " + type);
                }
                selectedFields[type].push(field);

                // if(!req.permissions.can(AbilityAction.Read, type, field)) {
                //     this.logger.verbose(`Failed field-base permissionsFor rule test for field "${type}.${field}".`);
                //     req.passed = false;
                //     return of(null);
                // }
            }

            return handler().pipe(
                map((values) => {
                    // Handler already marked the request as failed for some permission error.
                    if (req.passed === false) {
                        this.logger.verbose("Failed permissionsFor rule test. Handler already marked as failed.");
                        return null;
                    }

                    // If the value is nullish, there's no value to check, so just return null.
                    if (values === null || values === undefined) {
                        req.passed = true;
                        return null;
                    }

                    // Repeat previous tests with the values as the subject.

                    for (const value of values) {
                        const subjectStr = "userId" in value ? "UserPermission" : "GroupPermission";
                        const subjectObj = subject(subjectStr, value);
                        if (!req.permissions.can(AbilityAction.Read, subjectObj)) {
                            this.logger.verbose("Failed basic permissionsFor rule test on one or more values.");
                            req.passed = false;
                            return null;
                        }

                        // Test the ability against each requested field with subject value.
                        for (const field of selectedFields[subjectStr]) {
                            if (!req.permissions.can(AbilityAction.Read, subjectObj, field)) {
                                // Strict mode will cause the entire request to fail if any field fails. Otherwise, the field
                                //  will be set to null. The user won't necessarily know (as of now) whether the field is
                                //  actually null, or they just can't read it.
                                if (rule[2]?.strict ?? false) {
                                    this.logger.verbose(
                                        `Failed field-based permissionsFor rule test for field "${subjectStr}.${field}" on one or more values.`
                                    );
                                    req.passed = false;
                                    return null;
                                } else {
                                    this.logger.verbose(
                                        `Failed field-based permissionsFor rule test for field "${subjectStr}.${field}" on one value. More may come...`
                                    );
                                    value[field] = null;
                                }
                            }
                        }
                    }

                    req.passed = true;
                    return values;
                })
            );
        }
    } as const;

    createBasic(schema: GraphQLSchema, directiveName: string) {
        return mapSchema(schema, {
            [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
                const rules = getDirective(schema, fieldConfig, directiveName);

                if (rules && rules.length > 0) {
                    const { resolve = defaultFieldResolver } = fieldConfig;

                    // Replace the original resolver with a function that *first* calls
                    // the original resolver, then converts its result to upper case
                    fieldConfig.resolve = async (source, args, context, info) => {
                        const resolverArgs = new GraphQLResolverArgs(source, args, context, info);
                        let nextRuleFn = (): Observable<any> => {
                            return defer(async () => {
                                const result = resolve(source, args, context, info);
                                // If the resolver explicitly said that the request should fail, throw a
                                //  ForbiddenException.
                                if (context.req.passed === false) {
                                    this.logger.debug(
                                        `Resolver failed (req.passed = ${context.req.passed}). Throwing 
                                        ForbiddenException.`
                                    );
                                    // Reset req.passed context variable.
                                    delete context.req.passed;
                                    throw new ForbiddenException();
                                }

                                return result;
                            });
                        };

                        for (let i = rules.length - 1; i >= 0; i--) {
                            const rule: RuleDef = [rules[i].ruleType, rules[i].subject, rules[i].options];
                            const ruleNameStr = this.caslHelper.formatRuleName(rule);

                            // Cannot pass nextRuleFn directly as it'd pass by reference and cause infinite loop.
                            const nextTemp = nextRuleFn;
                            const handler = this.caslHelper.handlers.get(rule[0]);

                            // This should only happen if handlers is not set up properly to define a handler for every
                            //  RuleType.
                            if (!handler) {
                                throw new Error(`Unsupported rule type ${rule[0]} on ${ruleNameStr}.`);
                            }

                            nextRuleFn = () => {
                                this.logger.verbose(`Initializing rule handler for ${ruleNameStr}`);

                                return handler(resolverArgs, rule, nextTemp).pipe(
                                    tap((value) => {
                                        this.logger.verbose(`Rule handler for ${ruleNameStr} returned.`);

                                        // If the rule failed, throw a ForbiddenException. We check for req.passed as
                                        //  this allows the actual handler to set this value to true/false if it needs
                                        //  to. This is particularly applicable to mutation handlers
                                        //  (create/update/delete), where you may want to check permissions mid-database
                                        //  transaction.
                                        if (!context.req.passed) {
                                            this.logger.debug(
                                                `${ruleNameStr} failed (req.passed = ${context.req.passed}). Throwing 
                                                ForbiddenException.`
                                            );
                                            // Reset req.passed context variable.
                                            delete context.req.passed;
                                            throw new ForbiddenException();
                                        }

                                        // Reset req.passed context variable.
                                        delete context.req.passed;
                                        return value;
                                    })
                                );
                            };
                        }

                        return await firstValueFrom(nextRuleFn());
                    };
                    return fieldConfig;
                }
            }
        });
    }

    createCustom(schema: GraphQLSchema, directiveName: string) {
        return mapSchema(schema, {
            [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
                const rules = getDirective(schema, fieldConfig, directiveName);

                if (rules && rules.length > 0) {
                    // Assert that all custom rules are defined while the app is initializing.
                    for (let i = rules.length - 1; i >= 0; i--) {
                        const customRuleFn = this.customRules[rules[i].name];
                        if (!customRuleFn) {
                            throw new Error(`Custom rule "${rules[i].name}" not found.`);
                        }
                    }

                    const { resolve = defaultFieldResolver } = fieldConfig;

                    // Replace the original resolver with a function that *first* calls
                    // the original resolver, then converts its result to upper case
                    fieldConfig.resolve = async (source, args, context, info) => {
                        const resolverArgs = new GraphQLResolverArgs(source, args, context, info);
                        let nextRuleFn = (): Observable<any> => {
                            return defer(async () => {
                                const result = resolve(source, args, context, info);
                                // If the resolver explicitly said that the request should fail, throw a
                                //  ForbiddenException.
                                if (context.req.passed === false) {
                                    this.logger.debug(
                                        `Resolver failed (req.passed = ${context.req.passed}). Throwing 
                                        ForbiddenException.`
                                    );
                                    // Reset req.passed context variable.
                                    delete context.req.passed;
                                    throw new ForbiddenException();
                                }

                                return result;
                            });
                        };

                        for (let i = rules.length - 1; i >= 0; i--) {
                            const customRuleFn = this.customRules[rules[i].name];
                            const rule: RuleDef = [RuleType.Custom, customRuleFn, rules[i].options];
                            const ruleNameStr = this.caslHelper.formatRuleName(rule);

                            // Cannot pass nextRuleFn directly as it'd pass by reference and cause infinite loop.
                            const nextTemp = nextRuleFn;
                            const handler = customRuleFn;

                            nextRuleFn = () => {
                                this.logger.verbose(`Initializing rule handler for ${ruleNameStr}`);

                                return handler(resolverArgs, rule, nextTemp).pipe(
                                    tap((value) => {
                                        this.logger.verbose(`Rule handler for ${ruleNameStr} returned.`);

                                        // If the rule failed, throw a ForbiddenException. We check for req.passed as
                                        //  this allows the actual handler to set this value to true/false if it needs
                                        //  to. This is particularly applicable to mutation handlers
                                        //  (create/update/delete), where you may want to check permissions mid-database
                                        //  transaction.
                                        if (!context.req.passed) {
                                            this.logger.debug(
                                                `${ruleNameStr} failed (req.passed = ${context.req.passed}). Throwing 
                                                ForbiddenException.`
                                            );
                                            // Reset req.passed context variable.
                                            delete context.req.passed;
                                            throw new ForbiddenException();
                                        }

                                        // Reset req.passed context variable.
                                        delete context.req.passed;
                                        return value;
                                    })
                                );
                            };
                        }

                        return await firstValueFrom(nextRuleFn());
                    };
                    return fieldConfig;
                }
            }
        });
    }
}

/**
 * A GraphQL enum type for the {@link RuleType} enum.
 */
export const GraphQLRuleType = new GraphQLEnumType({
    name: "RuleType",
    values: Object.keys(RuleType).reduce((values, type) => {
        // Custom is skipped here because custom rules are applied via the @custom_rule directive.
        if (type !== "Custom") {
            values[type] = { value: type };
        }
        return values;
    }, {})
});

/**
 * Based on {@link RuleOptions} type. Can't think of an easy way to infer this from the RuleOptions type.
 */
export const GraphQLRuleOptionsInput = new GraphQLInputObjectType({
    name: "RuleOptions",
    fields: {
        name: {
            type: GraphQLString
        },
        excludeFields: {
            type: new GraphQLList(new GraphQLNonNull(GraphQLString))
        },
        orderInputName: {
            type: GraphQLString
        },
        filterInputName: {
            type: GraphQLString
        },
        paginationInputName: {
            type: GraphQLString
        },
        inputName: {
            type: GraphQLString
        },
        strict: {
            type: GraphQLBoolean
        },
        defer: {
            type: GraphQLBoolean
        }
    }
});

/**
 * GraphQL rule directive definition which is passed to the GraphQL module in app.module.ts. This directive can be
 *  applied to field resolvers to apply a rule to the field. We use this instead of the @Rule decorator because
 *  of limitations with NestJS interceptors in GraphQL contexts.
 *  @see {@link https://github.com/nestjs/graphql/issues/631}
 */
export const GraphQLRuleDirective = new GraphQLDirective({
    name: "rule",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        ruleType: {
            type: GraphQLRuleType
        },
        subject: {
            type: GraphQLAbilitySubjectsType
        },
        options: {
            type: GraphQLRuleOptionsInput
        }
    }
});

/**
 * GraphQL custom rule directive definition which is passed to the GraphQL module in app.module.ts. This directive can
 *  be applied to field resolvers to apply a custom rule to the field. Custom rules reference functions defined in the
 *  {@link RuleDirective#customRules} map. We use this instead of the @Rule decorator because of limitations with NestJS
 *  interceptors in GraphQL contexts.
 *  @see {@link https://github.com/nestjs/graphql/issues/631}
 */
export const GraphQLCustomRuleDirective = new GraphQLDirective({
    name: "custom_rule",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        name: {
            type: new GraphQLNonNull(GraphQLString)
        },
        options: {
            type: GraphQLRuleOptionsInput
        }
    }
});
