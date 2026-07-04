import { Column, Entity, Index, PrimaryColumn } from "typeorm";
@Entity("fine_policies") @Index("idx_fine_policies_active",["isActive","effectiveFrom"])
export class FinePolicyOrmEntity{@PrimaryColumn("uuid")id:string;@Column({name:"overdue_per_day",type:"integer"})overduePerDay:number;@Column({name:"damaged_amount",type:"integer"})damagedAmount:number;@Column({name:"lost_amount",type:"integer"})lostAmount:number;@Column({name:"effective_from",type:"timestamptz"})effectiveFrom:Date;@Column({name:"is_active",default:true})isActive:boolean;}
