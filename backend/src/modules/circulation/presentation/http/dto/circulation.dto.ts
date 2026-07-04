import { ArrayNotEmpty, IsArray, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { ReturnCondition } from "../../../application/contracts/circulation.contracts";
export class BorrowBooksDto { @IsString() cardNumber: string; @IsArray() @ArrayNotEmpty() @IsString({ each: true }) barcodes: string[]; }
export class ReturnLineDto { @IsString() barcode: string; @IsEnum(ReturnCondition) condition: ReturnCondition; }
export class ReturnBooksDto { @IsArray() @ArrayNotEmpty() returns: ReturnLineDto[]; }
export class RenewLoanDto { @IsOptional() @IsArray() @IsUUID("4", { each: true }) itemIds?: string[]; }
