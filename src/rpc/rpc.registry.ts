import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ChannelWrapper } from "amqp-connection-manager";
import { AMQPQueues } from "../amqp/queues.enum";
import { RPC } from "./rpc.class";
import { AMQPService } from "../amqp/amqp.service";
import { ProductionService } from "../types/production/production.service";
import { PrismaService } from "../prisma/prisma.service";

export type RPCHandler = (params: Record<string, any>) => Promise<any>;

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
        this.register("createProduction", async (options) => {
            return await this.productionService.createProduction(options.data, this.prismaService);
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

                if (!data.method) {
                    this.logger.warn("RPC missing method");
                    return;
                }

                if (!data.params) {
                    this.logger.warn("RPC missing params");
                    return;
                }

                const rpc = new RPC(data.method, data.params, rmqMessage, this.amqpChannel);
                try {
                    await rpc.handle(this);
                } catch (e) {
                    this.logger.warn(`Error while handling RPC method "${data.method}": ${e}`);
                }
            },
            {
                prefetch: 1
            }
        );
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
