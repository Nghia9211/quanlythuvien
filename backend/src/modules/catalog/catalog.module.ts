import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SearchCatalogUseCase } from "./application/use-cases/search-catalog.use-case";
import { BookTitleRepository } from "./domain/repositories/book-title.repository";
import { BookCopyOrmEntity } from "./infrastructure/persistence/typeorm/entities/book-copy.orm-entity";
import { BookTitleOrmEntity } from "./infrastructure/persistence/typeorm/entities/book-title.orm-entity";
import { TypeOrmBookTitleRepository } from "./infrastructure/persistence/typeorm/repositories/typeorm-book-title.repository";
import { CatalogController } from "./presentation/http/catalog.controller";
import { randomUUID } from "crypto";
import { CatalogManagementUnitOfWork } from "./application/ports/catalog-management-unit-of-work.port";
import { CatalogIdentifierGenerator } from "./application/ports/catalog-system.ports";
import {
  CreateBookCopyUseCase, CreateBookTitleUseCase, CreateBranchUseCase,
  CreateShelfLocationUseCase, UpdateBookCopyUseCase, UpdateBookTitleUseCase,
} from "./application/use-cases/catalog-management.use-cases";
import { BranchOrmEntity } from "./infrastructure/persistence/typeorm/entities/branch.orm-entity";
import { ShelfLocationOrmEntity } from "./infrastructure/persistence/typeorm/entities/shelf-location.orm-entity";
import { CatalogManagementTypeOrmUnitOfWork } from "./infrastructure/persistence/typeorm/catalog-management-unit-of-work";
import { CatalogManagementController } from "./presentation/http/catalog-management.controller";

export const BOOK_TITLE_REPOSITORY = Symbol("BOOK_TITLE_REPOSITORY");
export const CATALOG_MANAGEMENT_UOW = Symbol("CATALOG_MANAGEMENT_UOW");
export const CATALOG_IDENTIFIER_GENERATOR = Symbol("CATALOG_IDENTIFIER_GENERATOR");

@Module({
  imports: [TypeOrmModule.forFeature([BookTitleOrmEntity, BookCopyOrmEntity, BranchOrmEntity, ShelfLocationOrmEntity])],
  controllers: [CatalogController, CatalogManagementController],
  providers: [
    {
      provide: BOOK_TITLE_REPOSITORY,
      useClass: TypeOrmBookTitleRepository,
    },
    {
      provide: SearchCatalogUseCase,
      inject: [BOOK_TITLE_REPOSITORY],
      useFactory: (repository: BookTitleRepository) => new SearchCatalogUseCase(repository),
    },
    { provide: CATALOG_MANAGEMENT_UOW, useClass: CatalogManagementTypeOrmUnitOfWork },
    { provide: CATALOG_IDENTIFIER_GENERATOR, useValue: { next: () => randomUUID() } satisfies CatalogIdentifierGenerator },
    {
      provide: CreateBookTitleUseCase, inject: [CATALOG_MANAGEMENT_UOW, CATALOG_IDENTIFIER_GENERATOR],
      useFactory: (uow: CatalogManagementUnitOfWork, ids: CatalogIdentifierGenerator) => new CreateBookTitleUseCase(uow, ids),
    },
    {
      provide: UpdateBookTitleUseCase, inject: [CATALOG_MANAGEMENT_UOW],
      useFactory: (uow: CatalogManagementUnitOfWork) => new UpdateBookTitleUseCase(uow),
    },
    {
      provide: CreateBranchUseCase, inject: [CATALOG_MANAGEMENT_UOW, CATALOG_IDENTIFIER_GENERATOR],
      useFactory: (uow: CatalogManagementUnitOfWork, ids: CatalogIdentifierGenerator) => new CreateBranchUseCase(uow, ids),
    },
    {
      provide: CreateShelfLocationUseCase, inject: [CATALOG_MANAGEMENT_UOW, CATALOG_IDENTIFIER_GENERATOR],
      useFactory: (uow: CatalogManagementUnitOfWork, ids: CatalogIdentifierGenerator) => new CreateShelfLocationUseCase(uow, ids),
    },
    {
      provide: CreateBookCopyUseCase, inject: [CATALOG_MANAGEMENT_UOW, CATALOG_IDENTIFIER_GENERATOR],
      useFactory: (uow: CatalogManagementUnitOfWork, ids: CatalogIdentifierGenerator) => new CreateBookCopyUseCase(uow, ids),
    },
    {
      provide: UpdateBookCopyUseCase, inject: [CATALOG_MANAGEMENT_UOW],
      useFactory: (uow: CatalogManagementUnitOfWork) => new UpdateBookCopyUseCase(uow),
    },
  ],
  exports: [SearchCatalogUseCase],
})
export class CatalogModule {}
