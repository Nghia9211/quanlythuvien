import { Fine, FineReason } from "../../domain/fine";
import { PaymentMethod, PaymentStatus, PaymentTransaction } from "../../domain/payment-transaction";
import { BillingError, BillingNotFoundError } from "../errors/billing.error";
import { BillingUnitOfWork } from "../ports/billing-unit-of-work.port";
import { PaymentGatewayPort } from "../ports/payment-gateway.port";
interface Ids{next():string}interface Clock{now():Date}
const fineView=(x:Fine)=>{const s=x.toSnapshot();return{...s,createdAt:s.createdAt.toISOString(),paidAt:s.paidAt?.toISOString()??null};};
const paymentView=(x:PaymentTransaction)=>{const s=x.toSnapshot();return{...s,createdAt:s.createdAt.toISOString(),completedAt:s.completedAt?.toISOString()??null};};
const business=<T>(work:()=>T):T=>{try{return work();}catch(e){throw new BillingError((e as Error).message);}};

export class AssessFineUseCase{
 constructor(private uow:BillingUnitOfWork,private ids:Ids,private clock:Clock){}
 execute(c:{actorId:string;loanItemId:string}){return this.uow.execute(async tx=>{
  const item=await tx.findReturnedItem(c.loanItemId);if(!item)throw new BillingNotFoundError("Returned loan item not found");const policy=await tx.getActivePolicy();
  const candidates:Array<{reason:FineReason;amount:number}>=[];
  if(item.overdueDays>0)candidates.push({reason:FineReason.OVERDUE,amount:item.overdueDays*policy.overduePerDay});
  if(item.condition==="DAMAGED")candidates.push({reason:FineReason.DAMAGED,amount:policy.damagedAmount});
  if(item.condition==="LOST")candidates.push({reason:FineReason.LOST,amount:policy.lostAmount});
  const output:Fine[]=[];for(const candidate of candidates){const existing=await tx.findFine(item.loanItemId,candidate.reason);if(existing){output.push(existing);continue;}
   const fine=Fine.create({id:this.ids.next(),readerId:item.readerId,loanId:item.loanId,loanItemId:item.loanItemId,reason:candidate.reason,amount:candidate.amount,createdAt:this.clock.now()});await tx.saveFine(fine);await tx.appendAudit({actorId:c.actorId,action:"FINE_ASSESSED",aggregateId:fine.id,details:{reason:candidate.reason,amount:candidate.amount}});output.push(fine);}
  return output.map(fineView);
 });}
}
export class CreatePaymentUseCase{
 constructor(private uow:BillingUnitOfWork,private ids:Ids,private clock:Clock,private gateway:PaymentGatewayPort){}
 execute(c:{actorId:string;readerId:string;fineIds:string[];method:PaymentMethod}){return this.uow.execute(async tx=>{
  if(!c.fineIds.length||new Set(c.fineIds).size!==c.fineIds.length)throw new BillingError("Unique fine IDs are required");const fines=await tx.findFinesForUpdate(c.fineIds);
  if(fines.length!==c.fineIds.length)throw new BillingNotFoundError("One or more fines were not found");if(fines.some(x=>x.readerId!==c.readerId))throw new BillingError("All fines must belong to the reader");
  const id=this.ids.next(),total=fines.reduce((sum,x)=>sum+x.amount,0),now=this.clock.now();let payment:PaymentTransaction;
  if(c.method===PaymentMethod.CASH){payment=PaymentTransaction.createCash({id,readerId:c.readerId,fineIds:c.fineIds,totalAmount:total,createdAt:now});for(const fine of fines){business(()=>fine.reserveForPayment(id));fine.markPaid(id,now);await tx.saveFine(fine);}}
  else if(c.method===PaymentMethod.ONLINE){payment=PaymentTransaction.createOnline({id,readerId:c.readerId,fineIds:c.fineIds,totalAmount:total,providerReference:this.gateway.createReference(id),createdAt:now});for(const fine of fines){business(()=>fine.reserveForPayment(id));await tx.saveFine(fine);}}
  else throw new BillingError("Unsupported payment method");await tx.savePayment(payment);await tx.appendAudit({actorId:c.actorId,action:"PAYMENT_CREATED",aggregateId:id,details:{method:c.method,total}});return paymentView(payment);
 });}
}
export class SimulatePaymentUseCase{
 constructor(private uow:BillingUnitOfWork,private clock:Clock,private gateway:PaymentGatewayPort){}
 execute(c:{actorId:string;paymentId:string;result:PaymentStatus.SUCCEEDED|PaymentStatus.FAILED}){return this.uow.execute(async tx=>{
  const payment=await tx.findPayment(c.paymentId);if(!payment)throw new BillingNotFoundError("Payment not found");if(payment.method!==PaymentMethod.ONLINE)throw new BillingError("Only online payments can be simulated");
  const result=this.gateway.validateResult(c.result);if(payment.status===result)return paymentView(payment);business(()=>payment.confirm(result,this.clock.now()));const fines=await tx.findFinesForUpdate(payment.fineIds);
  for(const fine of fines){if(result===PaymentStatus.SUCCEEDED)business(()=>fine.markPaid(payment.id,this.clock.now()));else business(()=>fine.releasePayment(payment.id));await tx.saveFine(fine);}await tx.savePayment(payment);await tx.appendAudit({actorId:c.actorId,action:`PAYMENT_${result}`,aggregateId:payment.id});return paymentView(payment);
 });}
}
export class ListReaderFinesUseCase{constructor(private uow:BillingUnitOfWork){}execute(readerId:string,requester?:string){if(requester&&requester!==readerId)return Promise.reject(new BillingError("Reader is not allowed to view these fines"));return this.uow.execute(async tx=>(await tx.findFinesByReader(readerId)).map(fineView));}}
export class ListReaderPaymentsUseCase{constructor(private uow:BillingUnitOfWork){}execute(readerId:string,requester?:string){if(requester&&requester!==readerId)return Promise.reject(new BillingError("Reader is not allowed to view these payments"));return this.uow.execute(async tx=>(await tx.findPaymentsByReader(readerId)).map(paymentView));}}
