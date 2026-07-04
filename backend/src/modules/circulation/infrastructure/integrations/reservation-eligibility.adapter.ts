import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ReservationEligibilityPort } from "../../application/ports/circulation.ports";

@Injectable()
export class ReservationEligibilityAdapter implements ReservationEligibilityPort {
  constructor(private source: DataSource) {}
  async hasWaitingReservation(bookTitleId: string, excludingReaderId?: string) {
    const rows = await this.source.query(
      "SELECT EXISTS (SELECT 1 FROM reservations WHERE book_title_id = $1 AND status IN ('WAITING','ON_HOLD') AND ($2::uuid IS NULL OR reader_id <> $2::uuid)) AS exists",
      [bookTitleId, excludingReaderId ?? null],
    );
    return rows[0]?.exists === true;
  }
}
