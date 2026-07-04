import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AllocateReservationsUseCase, ExpireReservationsUseCase } from "../../application/use-cases/reservation.use-cases";

@Injectable()
export class ReservationScheduler {
  private readonly logger = new Logger(ReservationScheduler.name);
  constructor(private expireReservations: ExpireReservationsUseCase, private allocateReservations: AllocateReservationsUseCase) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async maintainQueues() {
    try {
      const expired = await this.expireReservations.execute();
      const allocated = await this.allocateReservations.executeAll();
      if (expired || allocated) this.logger.log(`Reservation maintenance: expired=${expired}, allocated=${allocated}`);
    } catch (error) { this.logger.error("Reservation maintenance failed", (error as Error).stack); }
  }
}
