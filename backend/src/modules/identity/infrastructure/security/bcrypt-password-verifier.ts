import { Injectable } from "@nestjs/common";
import { compare } from "bcryptjs";
import { PasswordVerifier } from "../../application/ports/security.ports";
@Injectable() export class BcryptPasswordVerifier implements PasswordVerifier { verify(password: string, hash: string) { return compare(password, hash); } }
