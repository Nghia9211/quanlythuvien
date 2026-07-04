import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { BorrowBooksUseCase, ListReaderLoansUseCase, RenewLoanUseCase, ReturnBooksUseCase } from "./application/use-cases/circulation.use-cases";
import { CirculationUnitOfWork } from "./application/ports/circulation-unit-of-work.port";
import { CirculationIdentifierGenerator, Clock, ReservationEligibilityPort } from "./application/ports/circulation.ports";
import { ReservationEligibilityAdapter } from "./infrastructure/integrations/reservation-eligibility.adapter";
import { BillingModule } from "@modules/billing/billing.module";
import { BillingFineAssessmentAdapter } from "./infrastructure/integrations/billing-fine-assessment.adapter";
import { LoanItemOrmEntity } from "./infrastructure/persistence/typeorm/entities/loan-item.orm-entity";
import { LoanOrmEntity } from "./infrastructure/persistence/typeorm/entities/loan.orm-entity";
import { LoanPolicyOrmEntity } from "./infrastructure/persistence/typeorm/entities/loan-policy.orm-entity";
import { TypeOrmCirculationUnitOfWork } from "./infrastructure/persistence/typeorm/circulation-unit-of-work";
import { CirculationController } from "./presentation/http/circulation.controller";
const UOW = Symbol("CIRCULATION_UOW"), IDS = Symbol("CIRCULATION_IDS"), CLOCK = Symbol("CIRCULATION_CLOCK"), RESERVATIONS = Symbol("CIRCULATION_RESERVATIONS"), FINES = Symbol("CIRCULATION_FINES");
@Module({
  imports: [TypeOrmModule.forFeature([LoanOrmEntity, LoanItemOrmEntity, LoanPolicyOrmEntity]), BillingModule], controllers: [CirculationController],
  providers: [
    ReservationEligibilityAdapter, BillingFineAssessmentAdapter, { provide: UOW, useClass: TypeOrmCirculationUnitOfWork },
    { provide: IDS, useValue: { next: () => randomUUID() } satisfies CirculationIdentifierGenerator },
    { provide: CLOCK, useValue: { now: () => new Date() } satisfies Clock }, { provide: RESERVATIONS, useExisting: ReservationEligibilityAdapter }, { provide: FINES, useExisting: BillingFineAssessmentAdapter },
    { provide: BorrowBooksUseCase, inject: [UOW, IDS, CLOCK], useFactory: (u: CirculationUnitOfWork,i: CirculationIdentifierGenerator,c: Clock) => new BorrowBooksUseCase(u,i,c) },
    { provide: ReturnBooksUseCase, inject: [UOW, CLOCK, FINES], useFactory: (u: CirculationUnitOfWork,c: Clock,f: any) => new ReturnBooksUseCase(u,c,f) },
    { provide: RenewLoanUseCase, inject: [UOW, RESERVATIONS, CLOCK], useFactory: (u: CirculationUnitOfWork,r: ReservationEligibilityPort,c: Clock) => new RenewLoanUseCase(u,r,c) },
    { provide: ListReaderLoansUseCase, inject: [UOW], useFactory: (u: CirculationUnitOfWork) => new ListReaderLoansUseCase(u) },
  ],
}) export class CirculationModule {}
