import { Test, TestingModule } from "@nestjs/testing";
import { PersonResolver } from "./person.resolver";
import { PrismaService } from "../../prisma/prisma.service";

describe("PersonResolver", () => {
    let resolver: PersonResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PersonResolver, PrismaService]
        }).compile();

        resolver = module.get<PersonResolver>(PersonResolver);
    });

    it("should be defined", () => {
        expect(resolver).toBeDefined();
    });
});
