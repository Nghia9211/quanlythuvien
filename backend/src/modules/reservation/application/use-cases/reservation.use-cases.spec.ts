import { Reservation, ReservationStatus } from "../../domain/reservation";
import { ReservationTransaction, ReservationUnitOfWork } from "../ports/reservation-unit-of-work.port";
import { AllocateReservationsUseCase, CancelReservationUseCase, ExpireReservationsUseCase, ListReservationsUseCase, PlaceReservationUseCase } from "./reservation.use-cases";

class Store implements ReservationUnitOfWork, ReservationTransaction {
  reservations: any[] = []; copies = [{ id: "copy-1", bookTitleId: "title-1", branchId: "branch-1", status: "AVAILABLE" }]; outbox: any[] = [];
  execute<T>(w: any) { return w(this); } findReader(id: string) { return Promise.resolve(id === "reader-1" ? { id, active: true } : null); }
  titleExists() { return Promise.resolve(true); } branchExists() { return Promise.resolve(true); } countActive() { return Promise.resolve(this.reservations.filter(x => ["WAITING","ON_HOLD"].includes(x.status)).length); }
  findDuplicate(r: string,t: string,b: string) { return Promise.resolve(this.reservations.find(x => x.readerId===r&&x.bookTitleId===t&&x.branchId===b&&["WAITING","ON_HOLD"].includes(x.status)) ?? null); }
  findReservation(id: string) { return Promise.resolve(this.reservations.find(x => x.id===id) ?? null); } saveReservation(x: any) { const i=this.reservations.findIndex(y=>y.id===x.id); i<0?this.reservations.push(x):this.reservations[i]=x; return Promise.resolve(); }
  findNextWaiting(t:string,b:string) { const row=this.reservations.find(x=>x.bookTitleId===t&&x.branchId===b&&x.status==="WAITING"); return Promise.resolve(row?Reservation.restore(row.toSnapshot()):null); }
  findAvailableCopy(t:string,b:string) { return Promise.resolve(this.copies.find(x=>x.bookTitleId===t&&x.branchId===b&&x.status==="AVAILABLE") ?? null); }
  findExpired() { return Promise.resolve(this.reservations.filter(x=>x.status==="ON_HOLD"&&x.holdExpiresAt<=new Date("2026-07-04T00:00:00Z"))); }
  saveCopy(x:any) { Object.assign(this.copies.find(y=>y.id===x.id)!,x); return Promise.resolve(); } addOutbox(x:any){this.outbox.push(x);return Promise.resolve();} appendAudit(){return Promise.resolve();}
  getActivePolicy(){return Promise.resolve({maxActiveReservations:5,holdHours:48});}
  findByReader(readerId:string){return Promise.resolve(this.reservations.filter(x=>x.readerId===readerId));}
  findWaitingQueues(){return Promise.resolve([]);}
}
class Ids { private i=0; next(){return ["res-1","msg-1"][this.i++];} } class Clock { now(){return new Date("2026-07-04T00:00:00Z");} }
describe("Reservation use cases", () => {
  it("places, immediately allocates and writes notification outbox", async () => {
    const s=new Store(); const place=new PlaceReservationUseCase(s,new Ids() as any,new Clock());
    const r=await place.execute({actorId:"account-1",readerId:"reader-1",bookTitleId:"title-1",branchId:"branch-1"});
    expect(r.status).toBe(ReservationStatus.ON_HOLD); expect(s.copies[0].status).toBe("ON_HOLD"); expect(s.outbox).toHaveLength(1);
    await expect(place.execute({actorId:"x",readerId:"reader-1",bookTitleId:"title-1",branchId:"branch-1"})).rejects.toThrow("active reservation");
  });
  it("cancels a hold and expires overdue holds", async () => {
    const s=new Store(); const ids=new Ids(); const place=new PlaceReservationUseCase(s,ids as any,new Clock()); const r=await place.execute({actorId:"a",readerId:"reader-1",bookTitleId:"title-1",branchId:"branch-1"});
    await new CancelReservationUseCase(s,new Ids() as any,new Clock()).execute({id:r.id,actorId:"a",requesterReaderId:"reader-1",reason:"Không cần nữa"}); expect(s.copies[0].status).toBe("AVAILABLE");
    s.reservations=[Reservation.restore({...s.reservations[0].toSnapshot(),id:"res-2",status:ReservationStatus.ON_HOLD,copyId:"copy-1",holdExpiresAt:new Date("2026-07-03") })]; s.copies[0].status="ON_HOLD";
    const n=await new ExpireReservationsUseCase(s,new Ids() as any,new Clock()).execute(); expect(n).toBe(1); expect(s.reservations[0].status).toBe("EXPIRED");
  });
  it("allocates FIFO waiting reservations", async () => {
    const s=new Store(); s.reservations=[Reservation.restore({id:"res-1",readerId:"reader-1",bookTitleId:"title-1",branchId:"branch-1",status:ReservationStatus.WAITING,copyId:null,holdExpiresAt:null,cancelReason:null,createdAt:new Date()})];
    const r=await new AllocateReservationsUseCase(s,new Ids() as any,new Clock()).execute("title-1","branch-1"); expect(r?.status).toBe("ON_HOLD");
  });
  it("lists only the requested reader's reservations and enforces ownership", async () => {
    const s=new Store(); await new PlaceReservationUseCase(s,new Ids() as any,new Clock()).execute({actorId:"a",readerId:"reader-1",bookTitleId:"title-1",branchId:"branch-1"});
    const list=new ListReservationsUseCase(s);
    await expect(list.execute("reader-1","reader-1")).resolves.toHaveLength(1);
    await expect(list.execute("reader-1","reader-2")).rejects.toThrow("not allowed");
  });
});
