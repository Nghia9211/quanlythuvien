import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class PlaceReservationDto {
  @IsUUID("4") bookTitleId: string;
  @IsUUID("4") branchId: string;
}

export class CancelReservationDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(500) reason?: string;
}

export class AllocateReservationDto {
  @IsUUID("4") bookTitleId: string;
  @IsUUID("4") branchId: string;
}
