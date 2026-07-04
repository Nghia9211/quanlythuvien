import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { PaymentTransactionOrmEntity } from "./payment-transaction.orm-entity";
@Entity("payment_fines")export class PaymentFineOrmEntity{@PrimaryColumn({name:"payment_id",type:"uuid"})paymentId:string;@PrimaryColumn({name:"fine_id",type:"uuid"})fineId:string;@ManyToOne(()=>PaymentTransactionOrmEntity,x=>x.fineLinks,{onDelete:"CASCADE"})@JoinColumn({name:"payment_id"})payment:PaymentTransactionOrmEntity;}
