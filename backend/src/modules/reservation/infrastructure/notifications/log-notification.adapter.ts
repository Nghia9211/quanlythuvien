import { Injectable, Logger } from "@nestjs/common";
import { NotificationPort, ReservationNotification } from "../../application/ports/notification.port";

@Injectable()
export class LogNotificationAdapter implements NotificationPort {
  private readonly logger = new Logger(LogNotificationAdapter.name);
  async send(message: ReservationNotification) {
    this.logger.log(`Reservation notification ${message.type} for reader ${message.readerId}: ${JSON.stringify(message.payload)}`);
  }
}
