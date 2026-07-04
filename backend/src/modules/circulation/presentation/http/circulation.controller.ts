import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { Roles } from "@common/decorators/roles.decorator";
import { Role } from "@common/enums/role.enum";
import { CirculationError, CirculationNotFoundError } from "../../application/errors/circulation.error";
import { BorrowBooksUseCase, ListReaderLoansUseCase, RenewLoanUseCase, ReturnBooksUseCase } from "../../application/use-cases/circulation.use-cases";
import { BorrowBooksDto, RenewLoanDto, ReturnBooksDto } from "./dto/circulation.dto";
@Controller("circulation")
export class CirculationController {
  constructor(private borrowBooks: BorrowBooksUseCase, private returnBooks: ReturnBooksUseCase, private renewLoan: RenewLoanUseCase, private listLoans: ListReaderLoansUseCase) {}
  @Roles(Role.STAFF) @Post("loans") borrow(@Body() body: BorrowBooksDto, @CurrentUser() user: any) { return this.handle(() => this.borrowBooks.execute({ ...body, actorId: user.id })); }
  @Roles(Role.STAFF) @Post("returns") return(@Body() body: ReturnBooksDto, @CurrentUser() user: any) { return this.handle(() => this.returnBooks.execute({ ...body, actorId: user.id })); }
  @Roles(Role.STAFF, Role.READER) @Post("loans/:loanId/renew") renew(@Param("loanId", ParseUUIDPipe) loanId: string, @Body() body: RenewLoanDto, @CurrentUser() user: any) { return this.handle(() => this.renewLoan.execute({ ...body, loanId, actorId: user.id, requesterReaderId: user.role === Role.READER ? user.readerId : undefined })); }
  @Roles(Role.STAFF, Role.READER) @Get("readers/:readerId/loans") list(@Param("readerId", ParseUUIDPipe) readerId: string, @CurrentUser() user: any) { return this.handle(() => this.listLoans.execute(readerId, user.role === Role.READER ? user.readerId : undefined)); }
  private async handle<T>(work: () => Promise<T>) { try { return await work(); } catch (e) { if (e instanceof CirculationNotFoundError) throw new NotFoundException(e.message); if (e instanceof CirculationError) throw new BadRequestException(e.message); throw e; } }
}
