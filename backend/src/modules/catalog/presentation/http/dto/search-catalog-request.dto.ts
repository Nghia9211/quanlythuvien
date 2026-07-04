import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Max, Min, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SearchCatalogRequestDto {
  @ApiProperty({ example: "kiến trúc phần mềm" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  query: string;

  @ApiPropertyOptional({ format: "uuid", description: "Chỉ tìm bản sao tại chi nhánh này" })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
