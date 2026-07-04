export { MembershipDomainError } from "../../domain/errors/membership-domain.error";

export class MembershipApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MembershipApplicationError";
  }
}

export class DuplicateReaderError extends MembershipApplicationError {
  constructor(readonly field: "email" | "identityNumber") {
    super(`A reader with this ${field} already exists`);
    this.name = "DuplicateReaderError";
  }
}

export class ReaderNotFoundError extends MembershipApplicationError {
  constructor(readerId: string) {
    super(`Reader ${readerId} was not found`);
    this.name = "ReaderNotFoundError";
  }
}

export class MembershipConflictError extends MembershipApplicationError {
  constructor(message: string) {
    super(message);
    this.name = "MembershipConflictError";
  }
}
