import { Injectable } from "@nestjs/common";
import { AssessFineUseCase } from "@modules/billing/application/use-cases/billing.use-cases";
import { FineAssessmentPort } from "../../application/ports/circulation.ports";
@Injectable()export class BillingFineAssessmentAdapter implements FineAssessmentPort{constructor(private assessFine:AssessFineUseCase){}async assess(input:{actorId:string;loanItemId:string}){await this.assessFine.execute(input);}}
