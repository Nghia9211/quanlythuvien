import { PaymentStatus } from "../../domain/payment-transaction";
export interface PaymentGatewayPort { createReference(paymentId:string):string;validateResult(result:PaymentStatus.SUCCEEDED|PaymentStatus.FAILED):PaymentStatus.SUCCEEDED|PaymentStatus.FAILED; }
