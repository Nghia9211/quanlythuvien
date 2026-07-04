import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { Roles } from "@common/decorators/roles.decorator";
import { Role } from "@common/enums/role.enum";
import { ReservationError, ReservationNotFoundError } from "../../application/errors/reservation.error";
import { AllocateReservationsUseCase, CancelReservationUseCase, ListReservationsUseCase, PlaceReservationUseCase } from "../../application/use-cases/reservation.use-cases";
import { AllocateReservationDto, CancelReservationDto, PlaceReservationDto } from "./dto/reservation.dto";

@Controller("reservations")
export class ReservationController {
  constructor(
    private placeReservation: PlaceReservationUseCase,
    private cancelReservation: CancelReservationUseCase,
    private allocateReservations: AllocateReservationsUseCase,
    private listReservations: ListReservationsUseCase,
  ) {}

  @Roles(Role.READER)
  @Post()
  place(@Body() body: PlaceReservationDto, @CurrentUser() user: any) {
    return this.handle(() => this.placeReservation.execute({ ...body, actorId: user.id, readerId: user.readerId }));
  }

  @Roles(Role.STAFF, Role.READER)
  @Get("readers/:readerId")
  list(@Param("readerId", ParseUUIDPipe) readerId: string, @CurrentUser() user: any) {
    return this.handle(() => this.listReservations.execute(readerId, user.role === Role.READER ? user.readerId : undefined));
  }

  @Roles(Role.STAFF, Role.READER)
  @Post(":id/cancel")
  cancel(@Param("id", ParseUUIDPipe) id: string, @Body() body: CancelReservationDto, @CurrentUser() user: any) {
    return this.handle(() => {
      if (user.role === Role.STAFF && !body.reason?.trim()) throw new ReservationError("Cancellation reason is required for staff");
      return this.cancelReservation.execute({
        id, actorId: user.id, requesterReaderId: user.role === Role.READER ? user.readerId : undefined,
        reason: body.reason?.trim() || "Cancelled by reader",
      });
    });
  }

  @Roles(Role.STAFF)
  @Post("allocate")
  allocate(@Body() body: AllocateReservationDto) {
    return this.handle(() => this.allocateReservations.execute(body.bookTitleId, body.branchId));
  }

  private async handle<T>(work: () => Promise<T>) {
    try { return await work(); }
    catch (error) {
      if (error instanceof ReservationNotFoundError) throw new NotFoundException(error.message);
      if (error instanceof ReservationError) throw new BadRequestException(error.message);
      throw error;
    }
  }
}
