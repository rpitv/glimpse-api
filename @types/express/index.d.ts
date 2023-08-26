import {GlimpseAbility} from "../../src/casl/casl-ability.factory";
import {User} from "../../src/types/user/user.entity";
import {PrismaService} from "../../src/prisma/prisma.service";

export type PrismaTransaction = Omit<PrismaService, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">;

declare module "express" {
    interface Request {
        permissions?: GlimpseAbility;
        user?: User;
        passed?: boolean;
        prismaTx?: PrismaTransaction;
    }
}
export {};
