import { ArrayNotEmpty,IsArray,IsEnum,IsIn,IsOptional,IsUUID } from "class-validator";
import { PaymentMethod,PaymentStatus } from "../../../application/contracts/billing.contracts";
export class CalculateFineDto{@IsUUID("4")loanItemId:string;}
export class CreatePaymentDto{@IsOptional()@IsUUID("4")readerId?:string;@IsArray()@ArrayNotEmpty()@IsUUID("4",{each:true})fineIds:string[];@IsEnum(PaymentMethod)method:PaymentMethod;}
export class SimulatePaymentDto{@IsIn([PaymentStatus.SUCCEEDED,PaymentStatus.FAILED])result:PaymentStatus.SUCCEEDED|PaymentStatus.FAILED;}
