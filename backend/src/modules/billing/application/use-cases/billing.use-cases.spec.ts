import { Fine, FineReason } from "../../domain/fine";
import { PaymentMethod, PaymentStatus, PaymentTransaction } from "../../domain/payment-transaction";
import { BillingTransaction, BillingUnitOfWork } from "../ports/billing-unit-of-work.port";
import { PaymentGatewayPort } from "../ports/payment-gateway.port";
import { AssessFineUseCase, CreatePaymentUseCase, ListReaderFinesUseCase, SimulatePaymentUseCase } from "./billing.use-cases";

class Store implements BillingUnitOfWork, BillingTransaction {
  fines: Fine[] = []; payments: PaymentTransaction[] = []; condition = "DAMAGED"; overdueDays = 2;
  execute<T>(work:(tx:BillingTransaction)=>Promise<T>){return work(this);}
  findReturnedItem(id:string){return Promise.resolve(id === "item-1" ? {loanItemId:id,loanId:"loan-1",readerId:"reader-1",condition:this.condition,overdueDays:this.overdueDays}:null);}
  getActivePolicy(){return Promise.resolve({overduePerDay:5000,damagedAmount:50000,lostAmount:200000});}
  findFine(item:string,reason:FineReason){return Promise.resolve(this.fines.find(x=>{const s=x.toSnapshot();return s.loanItemId===item&&s.reason===reason;})??null);}
  saveFine(x:Fine){const i=this.fines.findIndex(y=>y.id===x.id);i<0?this.fines.push(x):this.fines[i]=x;return Promise.resolve();}
  findFinesForUpdate(ids:string[]){return Promise.resolve(this.fines.filter(x=>ids.includes(x.id)));}
  savePayment(x:PaymentTransaction){const i=this.payments.findIndex(y=>y.id===x.id);i<0?this.payments.push(x):this.payments[i]=x;return Promise.resolve();}
  findPayment(id:string){return Promise.resolve(this.payments.find(x=>x.id===id)??null);}
  findFinesByReader(id:string){return Promise.resolve(this.fines.filter(x=>x.readerId===id));} findPaymentsByReader(id:string){return Promise.resolve(this.payments.filter(x=>x.readerId===id));}
  appendAudit(){return Promise.resolve();}
}
class Ids { private i=0; next(){return `id-${++this.i}`;} } class Clock { now(){return new Date("2026-07-04T00:00:00Z");} }
const gateway:PaymentGatewayPort={createReference:id=>`SIM-${id}`,validateResult:x=>x};

describe("Billing use cases",()=>{
  it("assesses overdue and damage fines idempotently",async()=>{
    const s=new Store(),uc=new AssessFineUseCase(s,new Ids(),new Clock());
    expect(await uc.execute({actorId:"staff",loanItemId:"item-1"})).toHaveLength(2);
    expect(s.fines.map(x=>x.amount)).toEqual([10000,50000]);
    await uc.execute({actorId:"staff",loanItemId:"item-1"});expect(s.fines).toHaveLength(2);
  });
  it("derives totals and completes cash payment atomically",async()=>{
    const s=new Store();await new AssessFineUseCase(s,new Ids(),new Clock()).execute({actorId:"staff",loanItemId:"item-1"});
    const result=await new CreatePaymentUseCase(s,new Ids(),new Clock(),gateway).execute({actorId:"staff",readerId:"reader-1",fineIds:s.fines.map(x=>x.id),method:PaymentMethod.CASH});
    expect(result.totalAmount).toBe(60000);expect(result.status).toBe(PaymentStatus.SUCCEEDED);expect(s.fines.every(x=>x.status==="PAID")).toBe(true);
  });
  it("keeps online fines reserved until simulated success or failure",async()=>{
    const s=new Store();await new AssessFineUseCase(s,new Ids(),new Clock()).execute({actorId:"staff",loanItemId:"item-1"});
    const create=new CreatePaymentUseCase(s,new Ids(),new Clock(),gateway);const pending=await create.execute({actorId:"reader",readerId:"reader-1",fineIds:[s.fines[0].id],method:PaymentMethod.ONLINE});
    expect(pending.status).toBe(PaymentStatus.PENDING);expect(s.fines[0].pendingPaymentId).toBeTruthy();
    await new SimulatePaymentUseCase(s,new Clock(),gateway).execute({actorId:"staff",paymentId:pending.id,result:PaymentStatus.FAILED});expect(s.fines[0].pendingPaymentId).toBeNull();
  });
  it("enforces reader ownership when listing",async()=>{
    const s=new Store(),list=new ListReaderFinesUseCase(s);
    await expect(list.execute("reader-1","reader-2")).rejects.toThrow("not allowed");
  });
});
