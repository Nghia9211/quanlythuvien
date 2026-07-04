export interface Clock { now(): Date; } export interface CirculationIdentifierGenerator { next(): string; }
export interface ReservationEligibilityPort { hasWaitingReservation(bookTitleId: string, excludingReaderId?: string): Promise<boolean>; }
export interface FineAssessmentPort { assess(input:{actorId:string;loanItemId:string}):Promise<void>; }
