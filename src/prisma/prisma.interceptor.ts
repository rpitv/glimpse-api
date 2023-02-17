import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { PrismaService } from "./prisma.service";
import { GqlContextType } from "@nestjs/graphql";
import { Request } from "express";

/**
 * Interceptor that creates a Prisma transaction for the duration of the request. This allows us to easily revert any
 *  changes made to the database if a system or permissions error occurs.
 *
 *  This applies specifically to HTTP requests. GraphQL requests are handled by an Apollo plugin instead, since NestJS
 *  interceptors currently seem to only encapsulate the first/top-level resolver, and not the entire request.
 *
 *  Typically, singular queries are implicitly wrapped in a transaction, so any locks only last however long the query
 *  takes to execute. However, we are explicitly wrapping all queries within the request in a transaction, so any locks
 *  will persist for the duration of the request. This could be a pretty serious downside, but it's the simplest way to
 *  implement this kind of request-wide rollback. We will have to evaluate the implementation of this if performance
 *  becomes a problem under heavy user load, or if we ever need to perform expensive tasks within a single request.
 *
 *  @see {@link https://www.prisma.io/docs/concepts/components/prisma-client/transactions}
 *  @see {@link https://www.postgresql.org/docs/current/transaction-iso.html}
 *  @see {@link https://github.com/nestjs/graphql/issues/631}
 *  @see {@link PrismaPlugin}
 */
@Injectable()
export class PrismaInterceptor implements NestInterceptor {
    private readonly logger: Logger = new Logger("PrismaInterceptor");

    constructor(private readonly prisma: PrismaService) {}

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        // Get the request object from the context. Currently only HTTP is supported.
        let req: Request;
        if (context.getType<GqlContextType>() === "http") {
            req = context.switchToHttp().getRequest();
        } else if (context.getType<GqlContextType>() === "graphql") {
            // For GraphQL contexts, an Apollo plugin is used due to the way interceptors work on GraphQL queries.
            //  See: https://github.com/nestjs/graphql/issues/631
            this.logger.verbose("Skipping PrismaInterceptor for GraphQL context. Using Apollo plugin instead.");
            return next.handle();
        } else {
            this.logger.debug(`Context type ${context.getType<GqlContextType>()} not supported by PrismaInterceptor.`);
            throw new Error("Unsupported context type");
        }

        this.logger.verbose("Creating Prisma transaction...");
        let closePrismaTx: () => void;

        // Create and await for a Prisma transaction.
        await new Promise((resolve) => {
            this.prisma.$transaction<void>(async (tx) => {
                this.logger.verbose("Prisma transaction created.");
                req.prismaTx = tx;
                // Resolve the upper Promise, allowing the request to continue.
                resolve(undefined);

                // Create another Promise and save the resolve function to be called when closePrismaTx is called.
                await new Promise((closeTransaction) => {
                    closePrismaTx = () => {
                        this.logger.verbose("Prisma transaction completed.");
                        closeTransaction(undefined);
                    };
                });
                // Transaction scope ends here, so transaction closes now.
            });
        });

        // Call closePrismaTx, closing the transaction, when this request (observable) is completed.
        return next.handle().pipe(
            tap({
                complete: () => closePrismaTx()
            })
        );
    }
}
