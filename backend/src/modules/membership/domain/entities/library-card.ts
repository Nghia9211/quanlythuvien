import { CardStatus } from "../enums/card-status.enum";
import { MembershipDomainError } from "../errors/membership-domain.error";

export interface LibraryCardSnapshot {
  id: string;
  cardNumber: string;
  status: CardStatus;
  issuedAt: Date;
  expiresAt: Date;
  lockReason: string | null;
}

export interface IssueLibraryCardInput {
  id: string;
  cardNumber: string;
  issuedAt: Date;
  expiresAt: Date;
}

export class LibraryCard {
  private constructor(private state: LibraryCardSnapshot) {}

  static issue(input: IssueLibraryCardInput): LibraryCard {
    const cardNumber = input.cardNumber.trim().toUpperCase();
    if (!cardNumber) throw new MembershipDomainError("Card number must not be empty");
    if (input.expiresAt <= input.issuedAt) {
      throw new MembershipDomainError("Card expiry must be after its issue date");
    }
    return new LibraryCard({
      ...input,
      cardNumber,
      status: CardStatus.ACTIVE,
      lockReason: null,
      issuedAt: new Date(input.issuedAt),
      expiresAt: new Date(input.expiresAt),
    });
  }

  static restore(snapshot: LibraryCardSnapshot): LibraryCard {
    return new LibraryCard({
      ...snapshot,
      issuedAt: new Date(snapshot.issuedAt),
      expiresAt: new Date(snapshot.expiresAt),
    });
  }

  get id(): string { return this.state.id; }
  get cardNumber(): string { return this.state.cardNumber; }
  get status(): CardStatus { return this.state.status; }
  get issuedAt(): Date { return new Date(this.state.issuedAt); }
  get expiresAt(): Date { return new Date(this.state.expiresAt); }
  get lockReason(): string | null { return this.state.lockReason; }

  renew(newExpiry: Date, now: Date): void {
    if (this.state.status === CardStatus.LOCKED) {
      throw new MembershipDomainError("Locked library card cannot be renewed");
    }
    const minimum = this.state.expiresAt > now ? this.state.expiresAt : now;
    if (newExpiry <= minimum) {
      throw new MembershipDomainError("Renewed card expiry must extend beyond the current validity");
    }
    this.state.expiresAt = new Date(newExpiry);
    this.state.status = CardStatus.ACTIVE;
    this.state.lockReason = null;
  }

  lock(reason: string): void {
    const normalizedReason = this.requireReason(reason);
    if (this.state.status === CardStatus.LOCKED) {
      throw new MembershipDomainError("Library card is already locked");
    }
    this.state.status = CardStatus.LOCKED;
    this.state.lockReason = normalizedReason;
  }

  unlock(reason: string): void {
    this.requireReason(reason);
    if (this.state.status !== CardStatus.LOCKED) {
      throw new MembershipDomainError("Only a locked library card can be unlocked");
    }
    this.state.status = CardStatus.ACTIVE;
    this.state.lockReason = null;
  }

  toSnapshot(): LibraryCardSnapshot {
    return {
      ...this.state,
      issuedAt: new Date(this.state.issuedAt),
      expiresAt: new Date(this.state.expiresAt),
    };
  }

  private requireReason(reason: string): string {
    const normalized = reason.trim();
    if (!normalized) throw new MembershipDomainError("Card status change requires a reason");
    return normalized;
  }
}
