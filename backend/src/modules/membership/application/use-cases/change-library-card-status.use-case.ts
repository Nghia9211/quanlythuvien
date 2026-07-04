import { ReaderNotFoundError } from "../errors/membership-application.error";
import { toReaderView } from "../mappers/reader-view.mapper";
import { MembershipUnitOfWork } from "../ports/membership-unit-of-work.port";

export interface ChangeLibraryCardStatusCommand {
  readerId: string;
  actorId: string;
  action: "LOCK" | "UNLOCK";
  reason: string;
}

export class ChangeLibraryCardStatusUseCase {
  constructor(private readonly unitOfWork: MembershipUnitOfWork) {}

  execute(command: ChangeLibraryCardStatusCommand) {
    return this.unitOfWork.execute(async (transaction) => {
      const reader = await transaction.findReaderById(command.readerId);
      if (!reader) throw new ReaderNotFoundError(command.readerId);
      if (command.action === "LOCK") reader.lockCard(command.reason);
      else reader.unlockCard(command.reason);
      await transaction.saveReader(reader);
      await transaction.appendAudit({
        actorId: command.actorId,
        action: command.action === "LOCK" ? "LIBRARY_CARD_LOCKED" : "LIBRARY_CARD_UNLOCKED",
        aggregateId: reader.id,
        reason: command.reason.trim(),
      });
      return toReaderView(reader);
    });
  }
}
