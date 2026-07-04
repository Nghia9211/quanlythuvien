import { BadRequestException, Body, Controller, NotFoundException, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { InventoryError, InventoryNotFoundError } from "../../application/errors/inventory.error";
import { CompleteInventoryUseCase, CreateInventoryUseCase, ScanInventoryCopyUseCase, UpdateCopyConditionUseCase } from "../../application/use-cases/inventory.use-cases";
import { CreateInventoryDto, ScanCopyDto, UpdateCopyStatusDto } from "./dto/inventory.dto";
@Permissions("inventory.write") @Controller("inventory")
export class InventoryController {
  constructor(private create: CreateInventoryUseCase, private scan: ScanInventoryCopyUseCase, private complete: CompleteInventoryUseCase, private update: UpdateCopyConditionUseCase) {}
  @Post("sessions") createSession(@Body() body: CreateInventoryDto, @CurrentUser() user: any) { return this.handle(() => this.create.execute({ ...body, actorId: user.id })); }
  @Post("sessions/:id/scan") scanCopy(@Param("id", ParseUUIDPipe) id: string, @Body() body: ScanCopyDto, @CurrentUser() user: any) { return this.handle(() => this.scan.execute({ sessionId: id, barcode: body.barcode, actorId: user.id })); }
  @Post("sessions/:id/complete") completeSession(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) { return this.handle(() => this.complete.execute({ sessionId: id, actorId: user.id })); }
  @Post("copies/status") updateCopy(@Body() body: UpdateCopyStatusDto, @CurrentUser() user: any) { return this.handle(() => this.update.execute({ ...body, actorId: user.id })); }
  private async handle<T>(work: () => Promise<T>) { try { return await work(); } catch (error) { if (error instanceof InventoryNotFoundError) throw new NotFoundException(error.message); if (error instanceof InventoryError) throw new BadRequestException(error.message); throw error; } }
}
