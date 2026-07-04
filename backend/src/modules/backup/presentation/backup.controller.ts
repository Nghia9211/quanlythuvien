import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { Equals, IsString } from "class-validator";
import { CreateBackupUseCase, ListBackupsUseCase, RestoreBackupUseCase } from "../application/backup.use-cases";
class RestoreDto { @IsString() @Equals("RESTORE") confirmation: string; }
@Permissions("backup.manage") @Controller("admin/backups")
export class BackupController {
  constructor(private create: CreateBackupUseCase, private list: ListBackupsUseCase, private restore: RestoreBackupUseCase) {}
  @Post() createBackup(@CurrentUser() user: any) { return this.create.execute(user.id); }
  @Get() listBackups() { return this.list.execute(); }
  @Post(":id/restore") async restoreBackup(@Param("id", ParseUUIDPipe) id: string, @Body() body: RestoreDto, @CurrentUser() user: any) { try { return await this.restore.execute({ backupId: id, actorId: user.id, confirmation: body.confirmation }); } catch (error) { throw new BadRequestException((error as Error).message); } }
}
