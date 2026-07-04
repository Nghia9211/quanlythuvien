import { Injectable, Optional, Inject } from "@nestjs/common";
import { hash } from "bcryptjs";

export const BCRYPT_ROUNDS = Symbol("BCRYPT_ROUNDS");

export interface PasswordHasher {
  hash(password: string): Promise<string>;
}

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(@Optional() @Inject(BCRYPT_ROUNDS) private readonly rounds: number = 12) {}

  hash(password: string): Promise<string> {
    return hash(password, this.rounds);
  }
}
