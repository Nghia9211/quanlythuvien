import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { RESERVATION_NOTIFICATION_PORT } from "./application/ports/notification.port";
import { ReservationUnitOfWork } from "./application/ports/reservation-unit-of-work.port";
import { AllocateReservationsUseCase, CancelReservationUseCase, ExpireReservationsUseCase, ListReservationsUseCase, PlaceReservationUseCase } from "./application/use-cases/reservation.use-cases";
import { LogNotificationAdapter } from "./infrastructure/notifications/log-notification.adapter";
import { NotificationOutboxDispatcher } from "./infrastructure/notifications/notification-outbox.dispatcher";
import { NotificationOutboxOrmEntity } from "./infrastructure/persistence/typeorm/entities/notification-outbox.orm-entity";
import { ReservationOrmEntity } from "./infrastructure/persistence/typeorm/entities/reservation.orm-entity";
import { ReservationPolicyOrmEntity } from "./infrastructure/persistence/typeorm/entities/reservation-policy.orm-entity";
import { TypeOrmReservationUnitOfWork } from "./infrastructure/persistence/typeorm/reservation-unit-of-work";
import { ReservationScheduler } from "./infrastructure/scheduling/reservation.scheduler";
import { ReservationController } from "./presentation/http/reservation.controller";

const UOW = Symbol("RESERVATION_UOW"), IDS = Symbol("RESERVATION_IDS"), CLOCK = Symbol("RESERVATION_CLOCK");
const ids = { next: () => randomUUID() }; const clock = { now: () => new Date() };

@Module({
  imports: [TypeOrmModule.forFeature([ReservationOrmEntity, ReservationPolicyOrmEntity, NotificationOutboxOrmEntity])],
  controllers: [ReservationController],
  providers: [
    LogNotificationAdapter, { provide: UOW, useClass: TypeOrmReservationUnitOfWork }, { provide: IDS, useValue: ids }, { provide: CLOCK, useValue: clock }, { provide: RESERVATION_NOTIFICATION_PORT, useExisting: LogNotificationAdapter },
    { provide: PlaceReservationUseCase, inject: [UOW, IDS, CLOCK], useFactory: (u: ReservationUnitOfWork, i: typeof ids, c: typeof clock) => new PlaceReservationUseCase(u, i, c) },
    { provide: CancelReservationUseCase, inject: [UOW, IDS, CLOCK], useFactory: (u: ReservationUnitOfWork, i: typeof ids, c: typeof clock) => new CancelReservationUseCase(u, i, c) },
    { provide: AllocateReservationsUseCase, inject: [UOW, IDS, CLOCK], useFactory: (u: ReservationUnitOfWork, i: typeof ids, c: typeof clock) => new AllocateReservationsUseCase(u, i, c) },
    { provide: ExpireReservationsUseCase, inject: [UOW, IDS, CLOCK], useFactory: (u: ReservationUnitOfWork, i: typeof ids, c: typeof clock) => new ExpireReservationsUseCase(u, i, c) },
    { provide: ListReservationsUseCase, inject: [UOW], useFactory: (u: ReservationUnitOfWork) => new ListReservationsUseCase(u) },
    NotificationOutboxDispatcher,
    ReservationScheduler,
  ],
})
export class ReservationModule {}
