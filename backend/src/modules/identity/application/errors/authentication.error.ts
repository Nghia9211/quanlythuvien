export { IdentityDomainError } from "../../domain/errors/identity-domain.error";
export class AuthenticationError extends Error { constructor(message = "Authentication failed") { super(message); this.name = "AuthenticationError"; } }
