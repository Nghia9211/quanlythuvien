import { Reader } from "../../domain/entities/reader";

export interface DuplicateReaderMatch {
  readerId: string;
  field: "email" | "identityNumber";
}

export interface AccountProvisioningInput {
  readerId: string;
  username: string;
  initialPassword: string;
}

export interface AuditEvent {
  actorId: string;
  action: string;
  aggregateId: string;
  reason?: string;
  details?: Record<string, unknown>;
}

export interface MembershipTransaction {
  findDuplicate(input: {
    email: string;
    identityNumber: string;
    excludeReaderId?: string;
  }): Promise<DuplicateReaderMatch | null>;
  findReaderById(readerId: string): Promise<Reader | null>;
  saveReader(reader: Reader): Promise<void>;
  provisionAccount(input: AccountProvisioningInput): Promise<void>;
  appendAudit(event: AuditEvent): Promise<void>;
}

export interface MembershipUnitOfWork {
  execute<T>(work: (transaction: MembershipTransaction) => Promise<T>): Promise<T>;
}
