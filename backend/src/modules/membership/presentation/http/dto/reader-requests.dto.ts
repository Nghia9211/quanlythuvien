import { Type } from "class-transformer";
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterReaderRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) fullName: string;
  @ApiProperty({ example: "2000-01-02" }) @Matches(/^\d{4}-\d{2}-\d{2}$/) dateOfBirth: string;
  @ApiProperty() @IsEmail() @MaxLength(320) email: string;
  @ApiPropertyOptional() @IsOptional() @Matches(/^\+?[0-9]{7,15}$/) phone?: string;
  @ApiProperty() @Matches(/^[A-Za-z0-9]{6,20}$/) identityNumber: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) address?: string;
  @ApiProperty() @Matches(/^[A-Za-z0-9._-]{3,50}$/) username: string;
  @ApiProperty({ minLength: 8 }) @IsString() @MinLength(8) initialPassword: string;
  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 60 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60) cardValidityMonths?: number;
}

export class UpdateReaderProfileRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) fullName?: string;
  @ApiPropertyOptional({ example: "2000-01-02" })
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() @MaxLength(320) email?: string;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @Matches(/^\+?[0-9]{7,15}$/) phone?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(500) address?: string | null;
}

export class RenewLibraryCardRequestDto {
  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 60 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60) validityMonths?: number;
}

export class ChangeCardStatusRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(500) reason: string;
}
