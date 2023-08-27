import {forwardRef, Module} from "@nestjs/common";
import {RPCRegistry} from "./rpc.registry";
import {AMQPModule} from "../amqp/amqp.module";
import {ProductionModule} from "../types/production/production.module";
import {PrismaModule} from "../prisma/prisma.module";

@Module({
    imports: [forwardRef(() => AMQPModule), ProductionModule, PrismaModule],
    providers: [RPCRegistry],
    exports: [RPCRegistry]
})
export class RPCModule {}
