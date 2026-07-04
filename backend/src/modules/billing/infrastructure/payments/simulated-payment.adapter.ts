import { Injectable } from "@nestjs/common";
import { PaymentGatewayPort } from "../../application/ports/payment-gateway.port";
import { PaymentStatus } from "../../domain/payment-transaction";
@Injectable()export class SimulatedPaymentAdapter implements PaymentGatewayPort{createReference(id:string){return`SIM-${id}`;}validateResult(result:PaymentStatus.SUCCEEDED|PaymentStatus.FAILED){if(![PaymentStatus.SUCCEEDED,PaymentStatus.FAILED].includes(result))throw new Error("Simulation result must be SUCCEEDED or FAILED");return result;}}
