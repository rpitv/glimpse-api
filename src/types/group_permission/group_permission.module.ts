import { Module } from "@nestjs/common";
import { GroupPermissionResolver } from "./group_permission.resolver";
import { PrismaModule } from "../../prisma/prisma.module";
import { UtilitiesService } from "../../utilities.service";

@Module({
    providers: [GroupPermissionResolver, UtilitiesService],
    imports: [PrismaModule]
})
export class GroupPermissionModule {}
