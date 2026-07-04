import { Reader } from "../../domain/entities/reader";
import { CardStatus } from "../../domain/enums/card-status.enum";
import { DuplicateReaderError, ReaderNotFoundError } from "../errors/membership-application.error";
import { Clock, IdentifierGenerator } from "../ports/system.ports";
import {
  AccountProvisioningInput,
  AuditEvent,
  DuplicateReaderMatch,
  MembershipTransaction,
  MembershipUnitOfWork,
} from "../ports/membership-unit-of-work.port";
import { ChangeLibraryCardStatusUseCase } from "./change-library-card-status.use-case";
import { GetReaderUseCase } from "./get-reader.use-case";
import { RegisterReaderUseCase } from "./register-reader.use-case";
import { RenewLibraryCardUseCase } from "./renew-library-card.use-case";
import { UpdateReaderProfileUseCase } from "./update-reader-profile.use-case";

class FixedClock implements Clock {
  now(): Date { return new Date("2026-07-04T00:00:00.000Z"); }
}

class SequenceIds implements IdentifierGenerator {
  private index = 0;
  constructor(private readonly ids: string[]) {}
  next(): string { return this.ids[this.index++]; }
}

class InMemoryMembership implements MembershipUnitOfWork, MembershipTransaction {
  readers = new Map<string, Reader>();
  accounts: AccountProvisioningInput[] = [];
  audits: AuditEvent[] = [];

  async execute<T>(work: (transaction: MembershipTransaction) => Promise<T>): Promise<T> {
    return work(this);
  }

  async findDuplicate(input: { email: string; identityNumber: string }): Promise<DuplicateReaderMatch | null> {
    for (const reader of this.readers.values()) {
      if (reader.email === input.email) return { readerId: reader.id, field: "email" };
      if (reader.identityNumber === input.identityNumber) {
        return { readerId: reader.id, field: "identityNumber" };
      }
    }
    return null;
  }

  async findReaderById(readerId: string): Promise<Reader | null> {
    return this.readers.get(readerId) ?? null;
  }

  async saveReader(reader: Reader): Promise<void> { this.readers.set(reader.id, reader); }
  async provisionAccount(input: AccountProvisioningInput): Promise<void> { this.accounts.push(input); }
  async appendAudit(event: AuditEvent): Promise<void> { this.audits.push(event); }
}

const registration = {
  actorId: "staff-1",
  fullName: "Nguyễn Văn An",
  dateOfBirth: "2000-01-02",
  email: "AN@example.com",
  phone: "0901234567",
  identityNumber: "001200000001",
  address: "Hà Nội",
  username: "reader.an",
  initialPassword: "StrongPass123!",
  cardValidityMonths: 12,
};

async function registeredMembership() {
  const store = new InMemoryMembership();
  const useCase = new RegisterReaderUseCase(
    store,
    new FixedClock(),
    new SequenceIds(["reader-00000001", "card-00000001"]),
  );
  const result = await useCase.execute(registration);
  return { store, result };
}

describe("Membership application use cases", () => {
  it("registers reader, card, account and audit in one unit of work", async () => {
    const { store, result } = await registeredMembership();

    expect(result.email).toBe("an@example.com");
    expect(result.card.cardNumber).toBe("LIB-CARD0000");
    expect(result.card.expiresAt).toBe("2027-07-04T00:00:00.000Z");
    expect(store.accounts).toEqual([
      {
        readerId: "reader-00000001",
        username: "reader.an",
        initialPassword: "StrongPass123!",
      },
    ]);
    expect(store.audits[0]).toMatchObject({ actorId: "staff-1", action: "READER_REGISTERED" });
  });

  it("rejects duplicate readers before provisioning an account", async () => {
    const { store } = await registeredMembership();
    const duplicate = new RegisterReaderUseCase(
      store,
      new FixedClock(),
      new SequenceIds(["reader-2", "card-2"]),
    );

    await expect(duplicate.execute({ ...registration, username: "other" })).rejects.toBeInstanceOf(
      DuplicateReaderError,
    );
    expect(store.accounts).toHaveLength(1);
  });

  it("gets and updates a reader while writing an audit event", async () => {
    const { store, result } = await registeredMembership();
    const getReader = new GetReaderUseCase(store);
    const update = new UpdateReaderProfileUseCase(store);

    await update.execute({
      readerId: result.id,
      actorId: "staff-1",
      fullName: "Nguyễn Văn Bình",
      phone: "0911111111",
      address: "Đà Nẵng",
    });
    const updated = await getReader.execute(result.id);

    expect(updated.fullName).toBe("Nguyễn Văn Bình");
    expect(store.audits.at(-1)).toMatchObject({ action: "READER_PROFILE_UPDATED" });
    await expect(getReader.execute("missing")).rejects.toBeInstanceOf(ReaderNotFoundError);
  });

  it("rejects an empty profile update", async () => {
    const { store, result } = await registeredMembership();
    const update = new UpdateReaderProfileUseCase(store);

    await expect(update.execute({ readerId: result.id, actorId: "staff-1" })).rejects.toThrow(
      "At least one profile field must be provided",
    );
  });

  it("renews an eligible card from its current expiry date", async () => {
    const { store, result } = await registeredMembership();
    const renew = new RenewLibraryCardUseCase(store, new FixedClock());

    const renewed = await renew.execute({ readerId: result.id, actorId: "staff-1", validityMonths: 12 });

    expect(renewed.card.expiresAt).toBe("2028-07-04T00:00:00.000Z");
    expect(store.audits.at(-1)).toMatchObject({ action: "LIBRARY_CARD_RENEWED" });
  });

  it("locks and unlocks a card with audited reasons", async () => {
    const { store, result } = await registeredMembership();
    const changeStatus = new ChangeLibraryCardStatusUseCase(store);

    const locked = await changeStatus.execute({
      readerId: result.id,
      actorId: "staff-1",
      action: "LOCK",
      reason: "Thẻ bị thất lạc",
    });
    expect(locked.card.status).toBe(CardStatus.LOCKED);
    expect(store.audits.at(-1)).toMatchObject({ reason: "Thẻ bị thất lạc" });

    const unlocked = await changeStatus.execute({
      readerId: result.id,
      actorId: "staff-1",
      action: "UNLOCK",
      reason: "Đã xác minh",
    });
    expect(unlocked.card.status).toBe(CardStatus.ACTIVE);
  });
});
