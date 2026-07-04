export class MembershipDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MembershipDomainError";
  }
}
