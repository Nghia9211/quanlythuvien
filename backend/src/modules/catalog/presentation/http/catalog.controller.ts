import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "@common/decorators/public.decorator";
import {
  InvalidCatalogSearchError,
  SearchCatalogUseCase,
} from "../../application/use-cases/search-catalog.use-case";
import { SearchCatalogRequestDto } from "./dto/search-catalog-request.dto";

@ApiTags("catalog")
@Controller("catalog")
export class CatalogController {
  constructor(private readonly searchCatalog: SearchCatalogUseCase) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Tra cứu mục lục và tình trạng bản sao theo chi nhánh" })
  async search(request: SearchCatalogRequestDto) {
    try {
      const result = await this.searchCatalog.execute(request);
      return {
        data: result.items,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      };
    } catch (error) {
      if (error instanceof InvalidCatalogSearchError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
