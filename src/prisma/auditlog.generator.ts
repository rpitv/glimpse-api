import { Logger } from "@nestjs/common";
import { AuditLog } from "../types/audit_log/audit_log.entity";
import { PrismaService } from "./prisma.service";
import { AbilitySubjects } from "../casl/casl-ability.factory";
import { User } from "@prisma/client";

export type AuditLogEntry = {
    displayText?: string;
    user?: User;
    subject?: Extract<AbilitySubjects, string>;
    id?: bigint;
    newValue?: any;
    oldValue?: any;
};

export class AuditLogGenerator {
    private logger = new Logger("AuditLogGenerator");

    public genAuditLog(prisma: PrismaService, entries: AuditLogEntry[]): Promise<AuditLog[]>;
    public genAuditLog(prisma: PrismaService, entry: AuditLogEntry): Promise<AuditLog>;
    public async genAuditLog(
        prisma: PrismaService,
        entry: AuditLogEntry[] | AuditLogEntry
    ): Promise<AuditLog[] | AuditLog> {
        if (Array.isArray(entry)) {
            return Promise.all(entry.map((entry) => this.genAuditLog(prisma, entry)));
        }

        this.logger.verbose(`Generating audit log for entry: ${JSON.stringify(entry)}`);
        return await prisma.auditLog.create({
            data: {
                message: entry.displayText,
                userId: entry.user?.id,
                subject: entry.subject,
                identifier: entry.id,
                oldValue: entry.oldValue,
                newValue: entry.newValue
            }
        });
    }
}
