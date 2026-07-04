import {
  DuplicateReaderError,
  MembershipApplicationError,
  ReaderNotFoundError,
} from "../errors/membership-application.error";
import { toReaderView } from "../mappers/reader-view.mapper";
import { MembershipUnitOfWork } from "../ports/membership-unit-of-work.port";
import { parseDateOnly } from "../utils/date.utils";

export interface UpdateReaderProfileCommand {
  readerId: string;
  actorId: string;
  fullName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
}

export class UpdateReaderProfileUseCase {
  constructor(private readonly unitOfWork: MembershipUnitOfWork) {}

  async execute(command: UpdateReaderProfileCommand) {
    const changes = [command.fullName, command.dateOfBirth, command.email, command.phone, command.address];
    if (changes.every((value) => value === undefined)) {
      throw new MembershipApplicationError("At least one profile field must be provided");
    }
    return this.unitOfWork.execute(async (transaction) => {
      const reader = await transaction.findReaderById(command.readerId);
      if (!reader) throw new ReaderNotFoundError(command.readerId);

      const email = command.email?.trim().toLocaleLowerCase("en-US") ?? reader.email;
      if (email !== reader.email) {
        const duplicate = await transaction.findDuplicate({
          email,
          identityNumber: reader.identityNumber,
          excludeReaderId: reader.id,
        });
        if (duplicate) throw new DuplicateReaderError(duplicate.field);
      }

      reader.updateProfile({
        fullName: command.fullName,
        dateOfBirth: command.dateOfBirth ? parseDateOnly(command.dateOfBirth) : undefined,
        email: command.email,
        phone: command.phone,
        address: command.address,
      });
      await transaction.saveReader(reader);
      await transaction.appendAudit({
        actorId: command.actorId,
        action: "READER_PROFILE_UPDATED",
        aggregateId: reader.id,
      });
      return toReaderView(reader);
    });
  }
}
