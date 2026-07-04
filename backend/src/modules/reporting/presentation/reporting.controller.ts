import { Controller, Get, Query } from "@nestjs/common";
import { Permissions } from "@common/decorators/permissions.decorator";
import { IsDateString, IsOptional, IsUUID } from "class-validator";
import { GetOperationalReportUseCase } from "../application/get-operational-report.use-case";
class ReportQueryDto { @IsDateString() from: string; @IsDateString() to: string; @IsOptional() @IsUUID("4") branchId?: string; }
@Permissions("reports.read") @Controller("reports")
export class ReportingController { constructor(private report: GetOperationalReportUseCase) {} @Get("operations") operations(@Query() query: ReportQueryDto) { return this.report.execute(query); } }
