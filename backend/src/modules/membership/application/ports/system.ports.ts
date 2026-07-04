export interface Clock {
  now(): Date;
}

export interface IdentifierGenerator {
  next(): string;
}
