import { Injectable } from "@nestjs/common";
import { hash } from "bcryptjs";

export interface PasswordHasher {
  hash(password: string): Promise<string>;
}

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds = 12) {}

  hash(password: string): Promise<string> {
    return hash(password, this.rounds);
  }
}
