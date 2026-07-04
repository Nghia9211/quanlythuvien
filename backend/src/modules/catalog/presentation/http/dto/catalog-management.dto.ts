import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
export class CreateBookTitleDto {
  @IsString() @IsNotEmpty() @MaxLength(500) title: string;
  @IsOptional() @IsString() isbn: string | null;
  @IsArray() @IsString({ each: true }) authors: string[];
  @IsArray() @IsString({ each: true }) subjects: string[];
  @IsOptional() @IsString() @MaxLength(255) publisher: string | null;
}
export class UpdateBookTitleDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() isbn?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) authors?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) subjects?: string[];
  @IsOptional() @IsString() publisher?: string | null;
}
export class CreateBranchDto { @IsString() @IsNotEmpty() code: string; @IsString() @IsNotEmpty() name: string; @IsOptional() @IsString() address: string | null; }
export class CreateShelfDto { @IsString() @IsNotEmpty() code: string; @IsString() @IsNotEmpty() label: string; }
export class CreateBookCopyDto {
  @IsUUID() bookTitleId: string; @IsString() @IsNotEmpty() barcode: string; @IsOptional() @IsString() rfid: string | null;
  @IsUUID() branchId: string; @IsUUID() shelfLocationId: string;
}
export class UpdateBookCopyDto {
  @IsOptional() @IsString() @IsNotEmpty() barcode?: string; @IsOptional() @IsString() rfid?: string | null;
  @IsOptional() @IsUUID() branchId?: string; @IsOptional() @IsUUID() shelfLocationId?: string;
}
