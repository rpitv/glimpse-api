import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ChannelWrapper } from "amqp-connection-manager";
import { AMQPQueues } from "../amqp/queues.enum";
import { RPC } from "./rpc.class";
import { AMQPService } from "../amqp/amqp.service";
import { ProductionService } from "../types/production/production.service";
import { PrismaService } from "../prisma/prisma.service";

export type RPCResponse = { error: any } | { data: any };
export type RPCHandler = (params: Record<string, any>) => Promise<RPCResponse>;

@Injectable()
export class RPCRegistry implements OnModuleInit {
    private readonly handlers: Map<string, RPCHandler> = new Map<string, RPCHandler>();
    private amqpChannel: ChannelWrapper;
    private logger: Logger = new Logger("RPCRegistry");

    constructor(
        private readonly amqpService: AMQPService,
        private readonly productionService: ProductionService,
        private readonly prismaService: PrismaService
    ) {}

    async onModuleInit() {
        await this.start();
        this.register("findManyProduction", async (options) => {
            try {
                return {
                    data: await this.productionService.findManyProduction(this.prismaService, {
                        filter: options.filter,
                        order: options.filter,
                        pagination: options.pagination
                    })
                };
            } catch (e) {
                this.logger.warn("Database error in deleteProduction handler: " + e);
                return { error: "Database error" };
            }
        });
        this.register("findOneProduction", async (options) => {
            let id: bigint;
            try {
                id = BigInt(options.id);
            } catch (e) {
                return { error: "Invalid id parameter. Must be a valid value that can be parsed into a BigInt." };
            }
            try {
                return {
                    data: await this.productionService.findOneProduction(id, this.prismaService)
                };
            } catch (e) {
                this.logger.warn("Database error in deleteProduction handler: " + e);
                return { error: "Database error" };
            }
        });
        this.register("createProduction", async (options) => {
            try {
                return {
                    data: await this.productionService.createProduction(options.data, this.prismaService)
                };
            } catch (e) {
                this.logger.warn("Database error in createProduction handler: " + e);
                return { error: "Database error" };
            }
        });
        this.register("updateProduction", async (options) => {
            let id: bigint;
            try {
                id = BigInt(options.id);
            } catch (e) {
                return { error: "Invalid id parameter. Must be a valid value that can be parsed into a BigInt." };
            }
            try {
                return {
                    data: await this.productionService.updateProduction(id, options.data, this.prismaService)
                };
            } catch (e) {
                this.logger.warn("Database error in updateProduction handler: " + e);
                return { error: "Database error" };
            }
        });
        this.register("deleteProduction", async (options) => {
            let id: bigint;
            try {
                id = BigInt(options.id);
            } catch (e) {
                return { error: "Invalid id parameter. Must be a valid value that can be parsed into a BigInt." };
            }
            try {
                return {
                    data: await this.productionService.deleteProduction(id, this.prismaService)
                };
            } catch (e) {
                this.logger.warn("Database error in deleteProduction handler: " + e);
                return { error: "Database error" };
            }
        });
        this.register("productionCount", async (options) => {
            try {
                return {
                    data: await this.productionService.productionCount(this.prismaService, { filter: options.filter })
                };
            } catch (e) {
                this.logger.warn("Database error in deleteProduction handler: " + e);
                return { error: "Database error" };
            }
        });
    }

    private async start(): Promise<void> {
        this.logger.log("Starting RPC registry");
        this.amqpChannel = this.amqpService.createChannel();
        await this.amqpChannel.consume(
            AMQPQueues.RPC,
            async (rmqMessage) => {
                this.logger.verbose("RPC received");

                let data: any;
                try {
                    data = JSON.parse(rmqMessage.content.toString());
                } catch (e) {
                    this.logger.warn("Failed to parse RPC due to JSON error: " + e);
                    return;
                }

                const rpc = new RPC(data.method, data.params, rmqMessage, this.amqpChannel);

                if (!data.method) {
                    this.logger.warn("RPC missing method");
                    await rpc.reply({ error: 'RPC missing "method" name.' }, false);
                    return;
                }

                if (!data.params) {
                    this.logger.warn("RPC missing params");
                    await rpc.reply({ error: 'RPC missing "params" object.' }, false);
                    return;
                }

                try {
                    await this.handle(rpc);
                } catch (e) {
                    this.logger.warn(`Error while handling RPC method "${data.method}": ${e}`);
                }
            },
            {
                prefetch: 1
            }
        );
    }

    private async handle(rpc: RPC): Promise<RPCResponse> {
        const handler = this.get(rpc.getMethod());
        if (!handler) {
            const response = { error: `No handler registered for method "${rpc.getMethod()}"` };
            this.logger.warn(`No handler registered for method "${rpc.getMethod()}"`);
            await rpc.reply(response, false);
            return response;
        }
        try {
            const result = await handler(rpc.getParams());
            await rpc.reply(result, false);
            return result;
        } catch (e) {
            const response = { error: "Uncaught exception" };
            this.logger.error(`Uncaught exception in RPC handler for RPC method "${rpc.getMethod()}": ${e}`);
            await rpc.reply(response, false);
            return response;
        }
    }

    public register(method: string, handler: RPCHandler): void {
        this.logger.debug(`Registering RPC handler for method ${method}.`);
        this.handlers.set(method, handler);
    }

    public get(method: string): RPCHandler {
        this.logger.verbose(`Retrieving RPC handler for method ${method}.`);
        return this.handlers.get(method);
    }
}
