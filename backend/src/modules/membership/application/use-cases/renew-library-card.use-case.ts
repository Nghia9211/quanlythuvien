import { MembershipApplicationError, ReaderNotFoundError } from "../errors/membership-application.error";
import { toReaderView } from "../mappers/reader-view.mapper";
import { MembershipUnitOfWork } from "../ports/membership-unit-of-work.port";
import { Clock } from "../ports/system.ports";
import { addMonthsClamped } from "../utils/date.utils";

export interface RenewLibraryCardCommand {
  readerId: string;
  actorId: string;
  validityMonths?: number;
}

export class RenewLibraryCardUseCase {
  constructor(private readonly unitOfWork: MembershipUnitOfWork, private readonly clock: Clock) {}

  execute(command: RenewLibraryCardCommand) {
    const validityMonths = command.validityMonths ?? 12;
    if (!Number.isInteger(validityMonths) || validityMonths < 1 || validityMonths > 60) {
      throw new MembershipApplicationError("Card validity must be between 1 and 60 months");
    }
    return this.unitOfWork.execute(async (transaction) => {
      const reader = await transaction.findReaderById(command.readerId);
      if (!reader) throw new ReaderNotFoundError(command.readerId);
      const now = this.clock.now();
      const base = reader.card.expiresAt > now ? reader.card.expiresAt : now;
      reader.renewCard(addMonthsClamped(base, validityMonths), now);
      await transaction.saveReader(reader);
      await transaction.appendAudit({
        actorId: command.actorId,
        action: "LIBRARY_CARD_RENEWED",
        aggregateId: reader.id,
        details: { expiresAt: reader.card.expiresAt.toISOString() },
      });
      return toReaderView(reader);
    });
  }
}
