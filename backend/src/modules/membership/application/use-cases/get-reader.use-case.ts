import { ReaderNotFoundError } from "../errors/membership-application.error";
import { toReaderView } from "../mappers/reader-view.mapper";
import { MembershipUnitOfWork } from "../ports/membership-unit-of-work.port";

export class GetReaderUseCase {
  constructor(private readonly unitOfWork: MembershipUnitOfWork) {}

  execute(readerId: string) {
    return this.unitOfWork.execute(async (transaction) => {
      const reader = await transaction.findReaderById(readerId);
      if (!reader) throw new ReaderNotFoundError(readerId);
      return toReaderView(reader);
    });
  }
}
