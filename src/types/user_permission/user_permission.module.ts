import { Module } from "@nestjs/common";
import { UserPermissionResolver } from "./user_permission.resolver";
import { PrismaModule } from "../../prisma/prisma.module";
import { CaslModule } from "../../casl/casl.module";
import { UtilitiesService } from "../../utilities.service";

@Module({
    providers: [UserPermissionResolver, UtilitiesService],
    imports: [PrismaModule, CaslModule]
})
export class UserPermissionModule {}
