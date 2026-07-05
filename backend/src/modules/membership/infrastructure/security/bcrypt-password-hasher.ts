import { Inject, Injectable, Optional } from "@nestjs/common";
import { hash } from "bcryptjs";

export interface PasswordHasher {
  hash(password: string): Promise<string>;
}
export const BCRYPT_ROUNDS = Symbol("BCRYPT_ROUNDS");

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(@Optional() @Inject(BCRYPT_ROUNDS) private readonly rounds = 12) {}

  hash(password: string): Promise<string> {
    return hash(password, this.rounds);
  }
}
