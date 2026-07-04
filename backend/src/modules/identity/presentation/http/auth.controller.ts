import { Body, Controller, Get, Post, UnauthorizedException } from "@nestjs/common";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { Public } from "@common/decorators/public.decorator";
import { AuthenticationError, IdentityDomainError } from "../../application/errors/authentication.error";
import { GetCurrentUserUseCase, LoginUseCase, LogoutUseCase, RefreshSessionUseCase } from "../../application/use-cases/authentication.use-cases";
import { LoginRequestDto, RefreshRequestDto } from "./dto/auth.dto";
@Controller("auth")
export class AuthController {
  constructor(private loginUseCase: LoginUseCase, private refreshUseCase: RefreshSessionUseCase, private logoutUseCase: LogoutUseCase, private currentUser: GetCurrentUserUseCase) {}
  @Public() @Post("login") login(@Body() body: LoginRequestDto) { return this.handle(() => this.loginUseCase.execute(body)); }
  @Public() @Post("refresh") refresh(@Body() body: RefreshRequestDto) { return this.handle(() => this.refreshUseCase.execute(body.refreshToken)); }
  @Post("logout") logout(@CurrentUser() user: any) { return this.handle(() => this.logoutUseCase.execute(user.id, user.sessionId)); }
  @Get("me") me(@CurrentUser("id") accountId: string) { return this.handle(() => this.currentUser.execute(accountId)); }
  private async handle<T>(work: () => Promise<T>) { try { return await work(); } catch (error) { if (error instanceof AuthenticationError || error instanceof IdentityDomainError) throw new UnauthorizedException(error.message); throw error; } }
}
