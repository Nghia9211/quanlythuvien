import type { BillingGateway } from "../../application/ports/billing.gateway";
import type { CreatePaymentCommand, Fine, PaymentResult, PaymentTransaction } from "../../domain/billing";
import type { HttpClient } from "../http/http-client";

export class HttpBillingGateway implements BillingGateway {
  constructor(private readonly client: HttpClient) {}

  listFines(readerId: string) {
    return this.client.get<Fine[]>(`/fines/readers/${encodeURIComponent(readerId)}`);
  }

  listPayments(readerId: string) {
    return this.client.get<PaymentTransaction[]>(`/payments/readers/${encodeURIComponent(readerId)}`);
  }

  createPayment(command: CreatePaymentCommand) {
    return this.client.post<PaymentTransaction>("/payments", command);
  }

  simulatePayment(paymentId: string, result: PaymentResult) {
    return this.client.post<PaymentTransaction>(`/payments/${encodeURIComponent(paymentId)}/simulate`, { result });
  }
}
