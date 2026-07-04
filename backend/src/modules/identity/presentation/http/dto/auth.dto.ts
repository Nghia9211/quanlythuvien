import { IsNotEmpty, IsString, MinLength } from "class-validator";
export class LoginRequestDto { @IsString() @IsNotEmpty() username: string; @IsString() @MinLength(8) password: string; }
export class RefreshRequestDto { @IsString() @IsNotEmpty() refreshToken: string; }
