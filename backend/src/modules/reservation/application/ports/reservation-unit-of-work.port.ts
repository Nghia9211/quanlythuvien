import { Reservation } from "../../domain/reservation";
export interface ReservationCopy{id:string;bookTitleId:string;branchId:string;status:string}
export interface ReservationPolicy { maxActiveReservations: number; holdHours: number; }
export interface ReservationQueue { bookTitleId: string; branchId: string; }
export interface ReservationTransaction{
 findReader(id:string):Promise<{id:string;active:boolean}|null>;titleExists(id:string):Promise<boolean>;branchExists(id:string):Promise<boolean>;countActive(readerId:string):Promise<number>;findDuplicate(readerId:string,titleId:string,branchId:string):Promise<Reservation|null>;
 findReservation(id:string):Promise<Reservation|null>;saveReservation(x:Reservation):Promise<void>;findNextWaiting(titleId:string,branchId:string):Promise<Reservation|null>;findAvailableCopy(titleId:string,branchId:string):Promise<ReservationCopy|null>;findExpired(now:Date):Promise<Reservation[]>;
 saveCopy(x:ReservationCopy):Promise<void>;addOutbox(x:{id:string;reservationId:string;readerId:string;type:string;payload:Record<string,unknown>}):Promise<void>;appendAudit(x:any):Promise<void>;
 getActivePolicy():Promise<ReservationPolicy>;findByReader(readerId:string):Promise<Reservation[]>;findWaitingQueues():Promise<ReservationQueue[]>;
}
export interface ReservationUnitOfWork{execute<T>(work:(tx:ReservationTransaction)=>Promise<T>):Promise<T>}
