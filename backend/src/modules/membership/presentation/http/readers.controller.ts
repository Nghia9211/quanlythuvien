import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { Roles } from "@common/decorators/roles.decorator";
import { Role } from "@common/enums/role.enum";
import {
  DuplicateReaderError,
  MembershipApplicationError,
  MembershipConflictError,
  MembershipDomainError,
  ReaderNotFoundError,
} from "../../application/errors/membership-application.error";
import { ChangeLibraryCardStatusUseCase } from "../../application/use-cases/change-library-card-status.use-case";
import { GetReaderUseCase } from "../../application/use-cases/get-reader.use-case";
import { RegisterReaderUseCase } from "../../application/use-cases/register-reader.use-case";
import { RenewLibraryCardUseCase } from "../../application/use-cases/renew-library-card.use-case";
import { UpdateReaderProfileUseCase } from "../../application/use-cases/update-reader-profile.use-case";
import {
  ChangeCardStatusRequestDto,
  RegisterReaderRequestDto,
  RenewLibraryCardRequestDto,
  UpdateReaderProfileRequestDto,
} from "./dto/reader-requests.dto";

@ApiTags("readers")
@Roles(Role.STAFF)
@Controller("readers")
export class ReadersController {
  constructor(
    private readonly registerReader: RegisterReaderUseCase,
    private readonly getReaderById: GetReaderUseCase,
    private readonly updateReader: UpdateReaderProfileUseCase,
    private readonly renewCard: RenewLibraryCardUseCase,
    private readonly changeCardStatus: ChangeLibraryCardStatusUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: "Đăng ký độc giả, phát hành thẻ và tài khoản" })
  register(@Body() request: RegisterReaderRequestDto, @CurrentUser("id") actorId: string) {
    return this.handle(() => this.registerReader.execute({ ...request, actorId }));
  }

  @Get(":readerId")
  @ApiOperation({ summary: "Tra cứu hồ sơ độc giả" })
  get(@Param("readerId", ParseUUIDPipe) readerId: string) {
    return this.handle(() => this.getReaderById.execute(readerId));
  }

  @Patch(":readerId")
  @ApiOperation({ summary: "Cập nhật hồ sơ độc giả" })
  update(
    @Param("readerId", ParseUUIDPipe) readerId: string,
    @Body() request: UpdateReaderProfileRequestDto,
    @CurrentUser("id") actorId: string,
  ) {
    return this.handle(() => this.updateReader.execute({ ...request, readerId, actorId }));
  }

  @Post(":readerId/renew")
  @ApiOperation({ summary: "Gia hạn thẻ thư viện" })
  renew(
    @Param("readerId", ParseUUIDPipe) readerId: string,
    @Body() request: RenewLibraryCardRequestDto,
    @CurrentUser("id") actorId: string,
  ) {
    return this.handle(() => this.renewCard.execute({ ...request, readerId, actorId }));
  }

  @Post(":readerId/lock")
  @ApiOperation({ summary: "Khóa thẻ thư viện" })
  lock(
    @Param("readerId", ParseUUIDPipe) readerId: string,
    @Body() request: ChangeCardStatusRequestDto,
    @CurrentUser("id") actorId: string,
  ) {
    return this.handle(() =>
      this.changeCardStatus.execute({ readerId, actorId, action: "LOCK", reason: request.reason }),
    );
  }

  @Post(":readerId/unlock")
  @ApiOperation({ summary: "Mở khóa thẻ thư viện" })
  unlock(
    @Param("readerId", ParseUUIDPipe) readerId: string,
    @Body() request: ChangeCardStatusRequestDto,
    @CurrentUser("id") actorId: string,
  ) {
    return this.handle(() =>
      this.changeCardStatus.execute({ readerId, actorId, action: "UNLOCK", reason: request.reason }),
    );
  }

  private async handle<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ReaderNotFoundError) throw new NotFoundException(error.message);
      if (error instanceof DuplicateReaderError || error instanceof MembershipConflictError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof MembershipDomainError || error instanceof MembershipApplicationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
