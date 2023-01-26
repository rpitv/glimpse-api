import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./local.strategy";
import { PassportModule } from "@nestjs/passport";
import { PrismaService } from "../prisma/prisma.service";
import { AuthResolver } from "./auth.resolver";
import { AuthSerializer } from "./auth.serializer";
import { AuthController } from "./auth.controller";
import { DiscordStrategy } from "./discord.strategy";

@Module({
    imports: [PassportModule],
    providers: [AuthService, PrismaService, LocalStrategy, DiscordStrategy, AuthResolver, AuthSerializer],
    controllers: [AuthController]
})
export class AuthModule {}
