import { LibraryCard, IssueLibraryCardInput, LibraryCardSnapshot } from "./library-card";
import { ReaderStatus } from "../enums/reader-status.enum";
import { MembershipDomainError } from "../errors/membership-domain.error";

export interface ReaderSnapshot {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  email: string;
  phone: string | null;
  identityNumber: string;
  address: string | null;
  status: ReaderStatus;
  card: LibraryCardSnapshot;
}

export interface RegisterReaderInput {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  email: string;
  phone?: string | null;
  identityNumber: string;
  address?: string | null;
  card: IssueLibraryCardInput;
}

export interface UpdateReaderProfileInput {
  fullName?: string;
  dateOfBirth?: Date;
  email?: string;
  phone?: string | null;
  address?: string | null;
}

export class Reader {
  private constructor(private state: Omit<ReaderSnapshot, "card">, readonly card: LibraryCard) {}

  static register(input: RegisterReaderInput): Reader {
    const profile = Reader.normalizeProfile(input, input.card.issuedAt);
    return new Reader(
      { ...profile, id: input.id, identityNumber: Reader.normalizeIdentity(input.identityNumber), status: ReaderStatus.ACTIVE },
      LibraryCard.issue(input.card),
    );
  }

  static restore(snapshot: ReaderSnapshot): Reader {
    return new Reader(
      {
        id: snapshot.id,
        fullName: snapshot.fullName,
        dateOfBirth: new Date(snapshot.dateOfBirth),
        email: snapshot.email,
        phone: snapshot.phone,
        identityNumber: snapshot.identityNumber,
        address: snapshot.address,
        status: snapshot.status,
      },
      LibraryCard.restore(snapshot.card),
    );
  }

  get id(): string { return this.state.id; }
  get fullName(): string { return this.state.fullName; }
  get dateOfBirth(): Date { return new Date(this.state.dateOfBirth); }
  get email(): string { return this.state.email; }
  get phone(): string | null { return this.state.phone; }
  get identityNumber(): string { return this.state.identityNumber; }
  get address(): string | null { return this.state.address; }
  get status(): ReaderStatus { return this.state.status; }

  updateProfile(input: UpdateReaderProfileInput): void {
    const merged = {
      fullName: input.fullName ?? this.state.fullName,
      dateOfBirth: input.dateOfBirth ?? this.state.dateOfBirth,
      email: input.email ?? this.state.email,
      phone: input.phone === undefined ? this.state.phone : input.phone,
      address: input.address === undefined ? this.state.address : input.address,
    };
    const profile = Reader.normalizeProfile(merged, this.card.issuedAt);
    this.state = { ...this.state, ...profile };
  }

  renewCard(newExpiry: Date, now: Date): void {
    if (this.state.status === ReaderStatus.RESTRICTED) {
      throw new MembershipDomainError("Restricted reader cannot renew a library card");
    }
    if (this.state.status === ReaderStatus.INACTIVE) {
      throw new MembershipDomainError("Inactive reader cannot renew a library card");
    }
    this.card.renew(newExpiry, now);
  }

  lockCard(reason: string): void { this.card.lock(reason); }
  unlockCard(reason: string): void { this.card.unlock(reason); }

  toSnapshot(): ReaderSnapshot {
    return {
      ...this.state,
      dateOfBirth: new Date(this.state.dateOfBirth),
      card: this.card.toSnapshot(),
    };
  }

  private static normalizeProfile(
    input: Pick<RegisterReaderInput, "fullName" | "dateOfBirth" | "email" | "phone" | "address">,
    referenceDate: Date,
  ) {
    const fullName = input.fullName.trim().replace(/\s+/g, " ");
    if (!fullName) throw new MembershipDomainError("Reader full name must not be empty");

    const email = input.email.trim().toLocaleLowerCase("en-US");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new MembershipDomainError("Reader email is invalid");
    }

    const dateOfBirth = new Date(input.dateOfBirth);
    if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth >= referenceDate) {
      throw new MembershipDomainError("Reader date of birth must be in the past");
    }

    const phone = input.phone?.trim() || null;
    if (phone && !/^\+?[0-9]{7,15}$/.test(phone)) {
      throw new MembershipDomainError("Reader phone number is invalid");
    }

    return {
      fullName,
      dateOfBirth,
      email,
      phone,
      address: input.address?.trim() || null,
    };
  }

  private static normalizeIdentity(identityNumber: string): string {
    const normalized = identityNumber.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,20}$/.test(normalized)) {
      throw new MembershipDomainError("Identity number must contain 6 to 20 letters or digits");
    }
    return normalized;
  }
}
