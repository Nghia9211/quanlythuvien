import { PaymentStatus } from "../../domain/payment-transaction";
import { SimulatedPaymentAdapter } from "./simulated-payment.adapter";
describe("SimulatedPaymentAdapter",()=>{const adapter=new SimulatedPaymentAdapter();it("creates deterministic references",()=>expect(adapter.createReference("p-1")).toBe("SIM-p-1"));it("accepts only terminal simulation results",()=>{expect(adapter.validateResult(PaymentStatus.SUCCEEDED)).toBe(PaymentStatus.SUCCEEDED);expect(()=>adapter.validateResult(PaymentStatus.PENDING as any)).toThrow();});});
