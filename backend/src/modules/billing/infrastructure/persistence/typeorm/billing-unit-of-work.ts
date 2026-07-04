import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, In } from "typeorm";
import { LoanItemOrmEntity } from "@modules/circulation/infrastructure/persistence/typeorm/entities/loan-item.orm-entity";
import { BillingError } from "../../../application/errors/billing.error";
import { BillingTransaction, BillingUnitOfWork } from "../../../application/ports/billing-unit-of-work.port";
import { Fine, FineReason } from "../../../domain/fine";
import { PaymentTransaction } from "../../../domain/payment-transaction";
import { FineOrmEntity } from "./entities/fine.orm-entity";import { FinePolicyOrmEntity } from "./entities/fine-policy.orm-entity";import { PaymentFineOrmEntity } from "./entities/payment-fine.orm-entity";import { PaymentTransactionOrmEntity } from "./entities/payment-transaction.orm-entity";
@Injectable()export class TypeOrmBillingUnitOfWork implements BillingUnitOfWork{constructor(private source:DataSource){}async execute<T>(work:(tx:BillingTransaction)=>Promise<T>){try{return await this.source.transaction(m=>work(new Tx(m)));}catch(e){if((e as any)?.driverError?.code==="23505")throw new BillingError("Fine or payment already exists");throw e;}}}
class Tx implements BillingTransaction{constructor(private m:EntityManager){}
 async findReturnedItem(id:string){const x=await this.m.getRepository(LoanItemOrmEntity).findOne({where:{id},relations:{loan:true}});return x?.returnedAt?{loanItemId:x.id,loanId:x.loanId,readerId:x.loan.readerId,condition:x.returnCondition,overdueDays:x.overdueDays}:null;}
 async getActivePolicy(){const x=await this.m.getRepository(FinePolicyOrmEntity).findOne({where:{isActive:true},order:{effectiveFrom:"DESC"}});if(!x)throw new Error("Active fine policy is not configured");return{overduePerDay:x.overduePerDay,damagedAmount:x.damagedAmount,lostAmount:x.lostAmount};}
 async findFine(item:string,reason:FineReason){const x=await this.m.getRepository(FineOrmEntity).findOne({where:{loanItemId:item,reason}});return x?this.fine(x):null;}
 async saveFine(value:Fine){const x=value.toSnapshot();await this.m.getRepository(FineOrmEntity).save(x);}
 async findFinesForUpdate(ids:string[]){const rows=await this.m.getRepository(FineOrmEntity).createQueryBuilder("fine").where("fine.id IN (:...ids)",{ids}).setLock("pessimistic_write").getMany();return rows.map(x=>this.fine(x));}
 async savePayment(value:PaymentTransaction){const x=value.toSnapshot();await this.m.getRepository(PaymentTransactionOrmEntity).save({id:x.id,readerId:x.readerId,totalAmount:x.totalAmount,method:x.method,status:x.status,providerReference:x.providerReference,createdAt:x.createdAt,completedAt:x.completedAt});await this.m.getRepository(PaymentFineOrmEntity).save(x.fineIds.map(fineId=>({paymentId:x.id,fineId})));}
 async findPayment(id:string){const x=await this.m.getRepository(PaymentTransactionOrmEntity).createQueryBuilder("payment").leftJoinAndSelect("payment.fineLinks","fineLink").where("payment.id = :id",{id}).setLock("pessimistic_write").getOne();return x?this.payment(x):null;}
 async findFinesByReader(readerId:string){return(await this.m.getRepository(FineOrmEntity).find({where:{readerId},order:{createdAt:"DESC"}})).map(x=>this.fine(x));}
 async findPaymentsByReader(readerId:string){return(await this.m.getRepository(PaymentTransactionOrmEntity).find({where:{readerId},relations:{fineLinks:true},order:{createdAt:"DESC"}})).map(x=>this.payment(x));}
 async appendAudit(e:any){await this.m.query("INSERT INTO audit_logs (actor_id,action,aggregate_type,aggregate_id,reason,details) VALUES ($1,$2,$3,$4,$5,$6::jsonb)",[e.actorId,e.action,"Billing",e.aggregateId,null,JSON.stringify(e.details??{})]);}
 private fine(x:FineOrmEntity){return Fine.restore({id:x.id,readerId:x.readerId,loanId:x.loanId,loanItemId:x.loanItemId,reason:x.reason,amount:x.amount,status:x.status,pendingPaymentId:x.pendingPaymentId,createdAt:x.createdAt,paidAt:x.paidAt});}
 private payment(x:PaymentTransactionOrmEntity){return PaymentTransaction.restore({id:x.id,readerId:x.readerId,fineIds:(x.fineLinks??[]).map(y=>y.fineId),totalAmount:x.totalAmount,method:x.method,status:x.status,providerReference:x.providerReference,createdAt:x.createdAt,completedAt:x.completedAt});}}
