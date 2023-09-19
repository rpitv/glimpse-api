import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient, UnwrapTuple } from "@prisma/client";
import { AuditLog } from "../types/audit_log/audit_log.entity";
import { AuditLogEntry, AuditLogGenerator } from "./auditlog.generator";
class BasePrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        super();
    }

    async onModuleInit(): Promise<void> {
        await this.$connect();
    }

    async enableShutdownHooks(app: INestApplication): Promise<void> {
        this.$on("beforeExit", async () => {
            await app.close();
        });
    }
}

@Injectable()
export class PrismaService extends BasePrismaService {
    private auditLogGenerator = new AuditLogGenerator();

    // Override $transaction so that interactive transactions will expect an ExtendedTransactionClient.
    override $transaction<P extends Prisma.PrismaPromise<any>[]>(
        arg: [...P],
        options?: { isolationLevel?: Prisma.TransactionIsolationLevel }
    ): Promise<UnwrapTuple<P>>;
    override $transaction<R>(
        fn: (prisma: Omit<this, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">) => Promise<R>,
        options?: {
            maxWait?: number;
            timeout?: number;
            isolationLevel?: Prisma.TransactionIsolationLevel;
            req?: Request;
        }
    ): Promise<R>;
    override async $transaction(...args: any[]): Promise<any> {
        if (typeof args[0] === "function") {
            const [fn, options] = args;
            return super.$transaction(async (tx) => {
                // Any necessary extension assignments can go here...
                tx.genAuditLog = this.genAuditLog.bind(tx);

                return await fn(tx);
            }, options);
        } else {
            return super.$transaction(args);
        }
    }

    genAuditLog(entries: AuditLogEntry[]): Promise<AuditLog[]>;
    genAuditLog(entry: AuditLogEntry): Promise<AuditLog>;
    async genAuditLog(entry: AuditLogEntry[] | AuditLogEntry): Promise<AuditLog[] | AuditLog> {
        // if(Array.isArray(entry)) {
        //     return await this.auditLogGenerator.genAuditLog(this, entry);
        // } else {
        //     return await this.auditLogGenerator.genAuditLog(this, entry);
        // }
        // Not sure why the cast is necessary. The code above does the same thing but with no casts.
        return await this.auditLogGenerator.genAuditLog(this, <AuditLogEntry>entry);
    }
}
