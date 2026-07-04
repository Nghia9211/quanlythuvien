export enum ReservationStatus { WAITING="WAITING", ON_HOLD="ON_HOLD", COMPLETED="COMPLETED", CANCELLED="CANCELLED", EXPIRED="EXPIRED" }
export interface ReservationSnapshot { id:string;readerId:string;bookTitleId:string;branchId:string;status:ReservationStatus;copyId:string|null;holdExpiresAt:Date|null;createdAt:Date;cancelReason:string|null; }
export class Reservation {
  private constructor(private s:ReservationSnapshot){} static create(x:Omit<ReservationSnapshot,"status"|"copyId"|"holdExpiresAt"|"cancelReason">){return new Reservation({...x,status:ReservationStatus.WAITING,copyId:null,holdExpiresAt:null,cancelReason:null});}
  static restore(x:ReservationSnapshot){return new Reservation({...x,createdAt:new Date(x.createdAt),holdExpiresAt:x.holdExpiresAt?new Date(x.holdExpiresAt):null});}
  get id(){return this.s.id} get readerId(){return this.s.readerId} get bookTitleId(){return this.s.bookTitleId} get branchId(){return this.s.branchId} get status(){return this.s.status} get copyId(){return this.s.copyId} get holdExpiresAt(){return this.s.holdExpiresAt} get createdAt(){return this.s.createdAt}
  allocate(copyId:string,expires:Date){if(this.s.status!==ReservationStatus.WAITING)throw new Error("Only waiting reservation can be allocated");this.s.status=ReservationStatus.ON_HOLD;this.s.copyId=copyId;this.s.holdExpiresAt=expires;}
  cancel(reason:string){if(![ReservationStatus.WAITING,ReservationStatus.ON_HOLD].includes(this.s.status))throw new Error("Reservation cannot be cancelled");if(!reason.trim())throw new Error("Cancellation reason is required");this.s.status=ReservationStatus.CANCELLED;this.s.cancelReason=reason.trim();}
  expire(){if(this.s.status!==ReservationStatus.ON_HOLD)throw new Error("Only held reservation can expire");this.s.status=ReservationStatus.EXPIRED;}
  complete(){if(this.s.status!==ReservationStatus.ON_HOLD)throw new Error("Only held reservation can complete");this.s.status=ReservationStatus.COMPLETED;}
  toSnapshot(){return{...this.s,createdAt:new Date(this.s.createdAt),holdExpiresAt:this.s.holdExpiresAt?new Date(this.s.holdExpiresAt):null};}
}
