import { Fine, FineReason } from "../../domain/fine";
import { PaymentTransaction } from "../../domain/payment-transaction";
export interface ReturnedItemForFine {loanItemId:string;loanId:string;readerId:string;condition:string|null;overdueDays:number}
export interface FinePolicy {overduePerDay:number;damagedAmount:number;lostAmount:number}
export interface BillingTransaction {
 findReturnedItem(id:string):Promise<ReturnedItemForFine|null>;getActivePolicy():Promise<FinePolicy>;findFine(itemId:string,reason:FineReason):Promise<Fine|null>;saveFine(value:Fine):Promise<void>;
 findFinesForUpdate(ids:string[]):Promise<Fine[]>;savePayment(value:PaymentTransaction):Promise<void>;findPayment(id:string):Promise<PaymentTransaction|null>;
 findFinesByReader(readerId:string):Promise<Fine[]>;findPaymentsByReader(readerId:string):Promise<PaymentTransaction[]>;appendAudit(event:{actorId:string;action:string;aggregateId:string;details?:Record<string,unknown>}):Promise<void>;
}
export interface BillingUnitOfWork {execute<T>(work:(tx:BillingTransaction)=>Promise<T>):Promise<T>}
