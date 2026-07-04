import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from "@nestjs/common";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { ArrayNotEmpty, IsArray, IsBoolean, IsDateString, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";
import { AdministrationError, CreateStaffUseCase, SetStaffActiveUseCase, UpsertRoleUseCase } from "../application/administration.use-cases";
import { QueryAuditLogsUseCase } from "../application/audit-query.use-case";
import { UpdatePolicyUseCase } from "../application/policy.use-case";
class CreateStaffDto { @IsString() @MinLength(3) username: string; @IsString() @MinLength(8) password: string; @IsString() role: string; }
class StatusDto { @IsBoolean() isActive: boolean; }
class RoleDto { @IsOptional() @IsString() name?: string; @IsArray() @ArrayNotEmpty() @IsString({ each: true }) permissions: string[]; }
class PolicyDto { @IsObject() values: Record<string, number>; }
class AuditQueryDto { @IsOptional() @IsDateString() from?: string; @IsOptional() @IsDateString() to?: string; @IsOptional() @IsUUID("4") actorId?: string; @IsOptional() @IsString() action?: string; @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number; }
@Permissions("admin.manage") @Controller("admin")
export class AdministrationController {
  constructor(private create: CreateStaffUseCase, private status: SetStaffActiveUseCase, private roles: UpsertRoleUseCase, private policy: UpdatePolicyUseCase, private audits: QueryAuditLogsUseCase) {}
  @Post("staff") createStaff(@Body() body: CreateStaffDto, @CurrentUser() user: any) { return this.handle(() => this.create.execute({ ...body, actorId: user.id })); }
  @Patch("staff/:id/status") setStatus(@Param("id", ParseUUIDPipe) id: string, @Body() body: StatusDto, @CurrentUser() user: any) { return this.handle(() => this.status.execute({ accountId: id, isActive: body.isActive, actorId: user.id })); }
  @Put("roles/:code") upsertRole(@Param("code") code: string, @Body() body: RoleDto, @CurrentUser() user: any) { return this.handle(() => this.roles.execute({ ...body, code, actorId: user.id })); }
  @Put("policies/:group") updatePolicy(@Param("group") group: string, @Body() body: PolicyDto, @CurrentUser() user: any) { return this.handle(() => this.policy.execute({ group, values: body.values, actorId: user.id })); }
  @Get("audit-logs") auditLogs(@Query() query: AuditQueryDto) { return this.audits.execute(query); }
  private async handle<T>(work: () => Promise<T>) { try { return await work(); } catch (error) { if (error instanceof AdministrationError) throw new BadRequestException(error.message); throw error; } }
}
