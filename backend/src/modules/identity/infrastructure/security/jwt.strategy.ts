import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ValidateAccessSessionUseCase } from "../../application/use-cases/authentication.use-cases";
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private validateSession: ValidateAccessSessionUseCase) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: config.get<string>("jwt.accessSecret")! });
  }
  async validate(payload: any) {
    if (payload.typ !== "access" || !payload.sub || !payload.sid) return false;
    const user = await this.validateSession.execute(payload.sub, payload.sid);
    return { ...user, sessionId: payload.sid };
  }
}
