import { CardStatus } from "../enums/card-status.enum";
import { ReaderStatus } from "../enums/reader-status.enum";
import { MembershipDomainError } from "../errors/membership-domain.error";
import { Reader } from "./reader";

const issuedAt = new Date("2026-07-04T00:00:00.000Z");
const expiresAt = new Date("2027-07-04T00:00:00.000Z");

function activeReader(): Reader {
  return Reader.register({
    id: "reader-1",
    fullName: "  Nguyễn Văn An  ",
    dateOfBirth: new Date("2000-01-02T00:00:00.000Z"),
    email: "  AN@example.com ",
    phone: " 0901234567 ",
    identityNumber: " 001200000001 ",
    address: " Hà Nội ",
    card: {
      id: "card-1",
      cardNumber: "LIB-CARD1",
      issuedAt,
      expiresAt,
    },
  });
}

describe("Reader aggregate", () => {
  it("normalizes a valid registration and activates its card", () => {
    const reader = activeReader();

    expect(reader.fullName).toBe("Nguyễn Văn An");
    expect(reader.email).toBe("an@example.com");
    expect(reader.identityNumber).toBe("001200000001");
    expect(reader.status).toBe(ReaderStatus.ACTIVE);
    expect(reader.card.status).toBe(CardStatus.ACTIVE);
  });

  it.each([
    [{ fullName: " " }, "Reader full name must not be empty"],
    [{ email: "not-an-email" }, "Reader email is invalid"],
    [{ identityNumber: "12" }, "Identity number must contain 6 to 20 letters or digits"],
  ])("rejects invalid registration data %#", (override, message) => {
    expect(() =>
      Reader.register({
        id: "reader-1",
        fullName: "Nguyễn Văn An",
        dateOfBirth: new Date("2000-01-02T00:00:00.000Z"),
        email: "an@example.com",
        phone: "0901234567",
        identityNumber: "001200000001",
        address: "Hà Nội",
        card: { id: "card-1", cardNumber: "LIB-CARD1", issuedAt, expiresAt },
        ...override,
      }),
    ).toThrow(message);
  });

  it("updates mutable profile fields without changing identity", () => {
    const reader = activeReader();
    reader.updateProfile({ fullName: "Nguyễn Văn Bình", phone: "0911111111", address: "Đà Nẵng" });

    expect(reader.fullName).toBe("Nguyễn Văn Bình");
    expect(reader.phone).toBe("0911111111");
    expect(reader.address).toBe("Đà Nẵng");
    expect(reader.identityNumber).toBe("001200000001");
  });

  it("requires reasons and valid transitions when locking or unlocking a card", () => {
    const reader = activeReader();

    expect(() => reader.lockCard(" ")).toThrow("Card status change requires a reason");
    reader.lockCard("Thẻ bị thất lạc");
    expect(reader.card.status).toBe(CardStatus.LOCKED);
    expect(() => reader.lockCard("again")).toThrow("Library card is already locked");
    reader.unlockCard("Đã xác minh độc giả");
    expect(reader.card.status).toBe(CardStatus.ACTIVE);
  });

  it("rejects renewal for a restricted reader or locked card", () => {
    const restricted = Reader.restore({ ...activeReader().toSnapshot(), status: ReaderStatus.RESTRICTED });
    expect(() => restricted.renewCard(new Date("2028-07-04T00:00:00.000Z"), issuedAt)).toThrow(
      "Restricted reader cannot renew a library card",
    );

    const locked = activeReader();
    locked.lockCard("Thẻ bị thất lạc");
    expect(() => locked.renewCard(new Date("2028-07-04T00:00:00.000Z"), issuedAt)).toThrow(
      "Locked library card cannot be renewed",
    );
  });

  it("renews an eligible card to a future expiry date", () => {
    const reader = activeReader();
    const newExpiry = new Date("2028-07-04T00:00:00.000Z");

    reader.renewCard(newExpiry, issuedAt);

    expect(reader.card.expiresAt).toEqual(newExpiry);
    expect(() => reader.renewCard(issuedAt, issuedAt)).toThrow(MembershipDomainError);
  });
});
