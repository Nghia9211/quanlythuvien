import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { RolesGuard } from "@common/guards/roles.guard";
import { PermissionsGuard } from "@common/guards/permissions.guard";
import { UserAccountOrmEntity } from "@common/entities/user-account.orm-entity";
import { IdentityUnitOfWork } from "./application/ports/identity-unit-of-work.port";
import { AuthTokenService, Clock, IdentifierGenerator, PasswordVerifier } from "./application/ports/security.ports";
import { GetCurrentUserUseCase, LoginUseCase, LogoutUseCase, RefreshSessionUseCase, ValidateAccessSessionUseCase } from "./application/use-cases/authentication.use-cases";
import { AuthSessionOrmEntity } from "./infrastructure/persistence/typeorm/entities/auth-session.orm-entity";
import { TypeOrmIdentityUnitOfWork } from "./infrastructure/persistence/typeorm/identity-unit-of-work";
import { BcryptPasswordVerifier } from "./infrastructure/security/bcrypt-password-verifier";
import { JwtAuthGuard } from "./infrastructure/security/jwt-auth.guard";
import { JwtStrategy } from "./infrastructure/security/jwt.strategy";
import { JwtTokenService } from "./infrastructure/security/jwt-token.service";
import { AuthController } from "./presentation/http/auth.controller";
const UOW = Symbol("IDENTITY_UOW"), CLOCK = Symbol("IDENTITY_CLOCK"), IDS = Symbol("IDENTITY_IDS"), PASSWORDS = Symbol("PASSWORD_VERIFIER"), TOKENS = Symbol("AUTH_TOKEN_SERVICE");
@Module({
  imports: [PassportModule, JwtModule.register({}), TypeOrmModule.forFeature([UserAccountOrmEntity, AuthSessionOrmEntity])],
  controllers: [AuthController],
  providers: [
    BcryptPasswordVerifier, JwtTokenService, JwtStrategy,
    { provide: UOW, useClass: TypeOrmIdentityUnitOfWork }, { provide: CLOCK, useValue: { now: () => new Date() } satisfies Clock },
    { provide: IDS, useValue: { next: () => randomUUID() } satisfies IdentifierGenerator },
    { provide: PASSWORDS, useExisting: BcryptPasswordVerifier }, { provide: TOKENS, useExisting: JwtTokenService },
    { provide: LoginUseCase, inject: [UOW, PASSWORDS, TOKENS, CLOCK, IDS], useFactory: (u: IdentityUnitOfWork, p: PasswordVerifier, t: AuthTokenService, c: Clock, i: IdentifierGenerator) => new LoginUseCase(u,p,t,c,i) },
    { provide: RefreshSessionUseCase, inject: [UOW, TOKENS, CLOCK], useFactory: (u: IdentityUnitOfWork,t: AuthTokenService,c: Clock) => new RefreshSessionUseCase(u,t,c) },
    { provide: LogoutUseCase, inject: [UOW, CLOCK], useFactory: (u: IdentityUnitOfWork,c: Clock) => new LogoutUseCase(u,c) },
    { provide: GetCurrentUserUseCase, inject: [UOW], useFactory: (u: IdentityUnitOfWork) => new GetCurrentUserUseCase(u) },
    { provide: ValidateAccessSessionUseCase, inject: [UOW, CLOCK], useFactory: (u: IdentityUnitOfWork,c: Clock) => new ValidateAccessSessionUseCase(u,c) },
    { provide: APP_GUARD, useClass: JwtAuthGuard }, { provide: APP_GUARD, useClass: RolesGuard }, { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class IdentityModule {}
