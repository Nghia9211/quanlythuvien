export type ReaderStatus = "ACTIVE" | "INACTIVE";
export type LibraryCardStatus = "ACTIVE" | "LOCKED" | "EXPIRED";

export interface LibraryCard {
  id: string;
  cardNumber: string;
  status: LibraryCardStatus;
  issuedAt: string;
  expiresAt: string;
  lockReason: string | null;
}

export interface Reader {
  id: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string | null;
  identityNumber: string;
  address: string | null;
  status: ReaderStatus;
  card: LibraryCard;
}

export interface RegisterReaderInput {
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

export type UpdateReaderInput = Partial<Pick<
  Reader,
  "fullName" | "dateOfBirth" | "email" | "phone" | "address"
>>;
