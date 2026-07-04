import { Injectable } from "@nestjs/common";
import { ReservationEligibilityPort } from "../../application/ports/circulation.ports";
@Injectable() export class NoReservationAdapter implements ReservationEligibilityPort { hasWaitingReservation(): Promise<boolean> { return Promise.resolve(false); } }
