import { Reader } from "../../domain/entities/reader";

export function toReaderView(reader: Reader) {
  return {
    id: reader.id,
    fullName: reader.fullName,
    dateOfBirth: reader.dateOfBirth.toISOString().slice(0, 10),
    email: reader.email,
    phone: reader.phone,
    identityNumber: reader.identityNumber,
    address: reader.address,
    status: reader.status,
    card: {
      id: reader.card.id,
      cardNumber: reader.card.cardNumber,
      status: reader.card.status,
      issuedAt: reader.card.issuedAt.toISOString(),
      expiresAt: reader.card.expiresAt.toISOString(),
      lockReason: reader.card.lockReason,
    },
  };
}

export type ReaderView = ReturnType<typeof toReaderView>;
