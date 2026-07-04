import { Reader } from "../../domain/entities/reader";
import { DuplicateReaderError, MembershipApplicationError } from "../errors/membership-application.error";
import { toReaderView } from "../mappers/reader-view.mapper";
import { MembershipUnitOfWork } from "../ports/membership-unit-of-work.port";
import { Clock, IdentifierGenerator } from "../ports/system.ports";
import { addMonthsClamped, parseDateOnly } from "../utils/date.utils";

export interface RegisterReaderCommand {
  actorId: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  identityNumber: string;
  address?: string;
  username: string;
  initialPassword: string;
  cardValidityMonths?: number;
}

export class RegisterReaderUseCase {
  constructor(
    private readonly unitOfWork: MembershipUnitOfWork,
    private readonly clock: Clock,
    private readonly identifiers: IdentifierGenerator,
  ) {}

  execute(command: RegisterReaderCommand) {
    const now = this.clock.now();
    const email = command.email.trim().toLocaleLowerCase("en-US");
    const identityNumber = command.identityNumber.trim().toUpperCase();
    const username = command.username.trim().toLocaleLowerCase("en-US");
    const validityMonths = command.cardValidityMonths ?? 12;
    if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
      throw new MembershipApplicationError("Username must contain 3 to 50 safe characters");
    }
    if (command.initialPassword.length < 8) {
      throw new MembershipApplicationError("Initial password must contain at least 8 characters");
    }
    if (!Number.isInteger(validityMonths) || validityMonths < 1 || validityMonths > 60) {
      throw new MembershipApplicationError("Card validity must be between 1 and 60 months");
    }

    return this.unitOfWork.execute(async (transaction) => {
      const duplicate = await transaction.findDuplicate({ email, identityNumber });
      if (duplicate) throw new DuplicateReaderError(duplicate.field);

      const readerId = this.identifiers.next();
      const cardId = this.identifiers.next();
      const cardSuffix = cardId.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 8);
      const reader = Reader.register({
        id: readerId,
        fullName: command.fullName,
        dateOfBirth: parseDateOnly(command.dateOfBirth),
        email,
        phone: command.phone,
        identityNumber,
        address: command.address,
        card: {
          id: cardId,
          cardNumber: `LIB-${cardSuffix}`,
          issuedAt: now,
          expiresAt: addMonthsClamped(now, validityMonths),
        },
      });

      await transaction.saveReader(reader);
      await transaction.provisionAccount({
        readerId,
        username,
        initialPassword: command.initialPassword,
      });
      await transaction.appendAudit({
        actorId: command.actorId,
        action: "READER_REGISTERED",
        aggregateId: readerId,
        details: { cardId, cardNumber: reader.card.cardNumber },
      });
      return toReaderView(reader);
    });
  }
}
