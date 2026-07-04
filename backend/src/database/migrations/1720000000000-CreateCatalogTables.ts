import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateCatalogTables1720000000000 implements MigrationInterface {
  name = "CreateCatalogTables1720000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "unaccent"');
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');

    await queryRunner.createTable(
      new Table({
        name: "book_titles",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
          { name: "title", type: "varchar", length: "500" },
          { name: "isbn", type: "varchar", length: "20", isNullable: true },
          { name: "authors", type: "text", default: "''" },
          { name: "subjects", type: "text", default: "''" },
          { name: "publisher", type: "varchar", length: "255", isNullable: true },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      "book_titles",
      new TableIndex({ name: "idx_book_titles_title", columnNames: ["title"] }),
    );
    await queryRunner.createIndex(
      "book_titles",
      new TableIndex({
        name: "uq_book_titles_isbn",
        columnNames: ["isbn"],
        isUnique: true,
        where: "isbn IS NOT NULL",
      }),
    );
    await queryRunner.query(
      "CREATE INDEX idx_book_titles_title_trgm ON book_titles USING gin (LOWER(title) gin_trgm_ops)",
    );

    await queryRunner.createTable(
      new Table({
        name: "book_copies",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
          { name: "book_title_id", type: "uuid" },
          { name: "branch_id", type: "uuid" },
          { name: "barcode", type: "varchar", length: "100", isUnique: true },
          {
            name: "status",
            type: "enum",
            enumName: "book_copy_status_enum",
            enum: ["AVAILABLE", "ON_LOAN", "ON_HOLD", "DAMAGED", "LOST", "WITHDRAWN"],
            default: "'AVAILABLE'",
          },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      "book_copies",
      new TableForeignKey({
        name: "fk_book_copies_book_title",
        columnNames: ["book_title_id"],
        referencedTableName: "book_titles",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      }),
    );
    await queryRunner.createIndex(
      "book_copies",
      new TableIndex({
        name: "idx_book_copies_branch_status",
        columnNames: ["branch_id", "status"],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("book_copies", true);
    await queryRunner.dropTable("book_titles", true);
  }
}
