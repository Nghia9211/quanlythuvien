import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { ChangeLibraryCardStatusUseCase } from "./application/use-cases/change-library-card-status.use-case";
import { GetReaderUseCase } from "./application/use-cases/get-reader.use-case";
import { RegisterReaderUseCase } from "./application/use-cases/register-reader.use-case";
import { RenewLibraryCardUseCase } from "./application/use-cases/renew-library-card.use-case";
import { UpdateReaderProfileUseCase } from "./application/use-cases/update-reader-profile.use-case";
import { MembershipUnitOfWork } from "./application/ports/membership-unit-of-work.port";
import { Clock, IdentifierGenerator } from "./application/ports/system.ports";
import { AuditLogOrmEntity } from "./infrastructure/persistence/typeorm/entities/audit-log.orm-entity";
import { LibraryCardOrmEntity } from "./infrastructure/persistence/typeorm/entities/library-card.orm-entity";
import { ReaderAccountOrmEntity } from "./infrastructure/persistence/typeorm/entities/reader-account.orm-entity";
import { ReaderOrmEntity } from "./infrastructure/persistence/typeorm/entities/reader.orm-entity";
import { TypeOrmMembershipUnitOfWork } from "./infrastructure/persistence/typeorm/typeorm-membership-unit-of-work";
import { BcryptPasswordHasher } from "./infrastructure/security/bcrypt-password-hasher";
import { ReadersController } from "./presentation/http/readers.controller";

export const MEMBERSHIP_UNIT_OF_WORK = Symbol("MEMBERSHIP_UNIT_OF_WORK");
export const SYSTEM_CLOCK = Symbol("SYSTEM_CLOCK");
export const IDENTIFIER_GENERATOR = Symbol("IDENTIFIER_GENERATOR");

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReaderOrmEntity,
      LibraryCardOrmEntity,
      ReaderAccountOrmEntity,
      AuditLogOrmEntity,
    ]),
  ],
  controllers: [ReadersController],
  providers: [
    BcryptPasswordHasher,
    { provide: MEMBERSHIP_UNIT_OF_WORK, useClass: TypeOrmMembershipUnitOfWork },
    { provide: SYSTEM_CLOCK, useValue: { now: () => new Date() } satisfies Clock },
    { provide: IDENTIFIER_GENERATOR, useValue: { next: () => randomUUID() } satisfies IdentifierGenerator },
    {
      provide: RegisterReaderUseCase,
      inject: [MEMBERSHIP_UNIT_OF_WORK, SYSTEM_CLOCK, IDENTIFIER_GENERATOR],
      useFactory: (uow: MembershipUnitOfWork, clock: Clock, ids: IdentifierGenerator) =>
        new RegisterReaderUseCase(uow, clock, ids),
    },
    {
      provide: GetReaderUseCase,
      inject: [MEMBERSHIP_UNIT_OF_WORK],
      useFactory: (uow: MembershipUnitOfWork) => new GetReaderUseCase(uow),
    },
    {
      provide: UpdateReaderProfileUseCase,
      inject: [MEMBERSHIP_UNIT_OF_WORK],
      useFactory: (uow: MembershipUnitOfWork) => new UpdateReaderProfileUseCase(uow),
    },
    {
      provide: RenewLibraryCardUseCase,
      inject: [MEMBERSHIP_UNIT_OF_WORK, SYSTEM_CLOCK],
      useFactory: (uow: MembershipUnitOfWork, clock: Clock) => new RenewLibraryCardUseCase(uow, clock),
    },
    {
      provide: ChangeLibraryCardStatusUseCase,
      inject: [MEMBERSHIP_UNIT_OF_WORK],
      useFactory: (uow: MembershipUnitOfWork) => new ChangeLibraryCardStatusUseCase(uow),
    },
  ],
})
export class MembershipModule {}
