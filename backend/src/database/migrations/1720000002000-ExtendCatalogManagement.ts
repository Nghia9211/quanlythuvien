import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from "typeorm";

export class ExtendCatalogManagement1720000002000 implements MigrationInterface {
  name = "ExtendCatalogManagement1720000002000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({ name: "branches", columns: [
      { name: "id", type: "uuid", isPrimary: true }, { name: "code", type: "varchar", length: "50" },
      { name: "name", type: "varchar", length: "200" }, { name: "address", type: "varchar", length: "500", isNullable: true },
      { name: "created_at", type: "timestamptz", default: "now()" }, { name: "updated_at", type: "timestamptz", default: "now()" },
    ] }), true);
    await queryRunner.createIndex("branches", new TableIndex({ name: "uq_branches_code", columnNames: ["code"], isUnique: true }));
    await queryRunner.createTable(new Table({ name: "shelf_locations", columns: [
      { name: "id", type: "uuid", isPrimary: true }, { name: "branch_id", type: "uuid" },
      { name: "code", type: "varchar", length: "50" }, { name: "label", type: "varchar", length: "200" },
      { name: "created_at", type: "timestamptz", default: "now()" }, { name: "updated_at", type: "timestamptz", default: "now()" },
    ] }), true);
    await queryRunner.createIndex("shelf_locations", new TableIndex({ name: "uq_shelf_locations_branch_code", columnNames: ["branch_id", "code"], isUnique: true }));
    await queryRunner.createForeignKey("shelf_locations", new TableForeignKey({ name: "fk_shelves_branch", columnNames: ["branch_id"], referencedTableName: "branches", referencedColumnNames: ["id"], onDelete: "RESTRICT" }));
    await queryRunner.addColumns("book_copies", [
      new TableColumn({ name: "rfid", type: "varchar", length: "100", isNullable: true }),
      new TableColumn({ name: "shelf_location_id", type: "uuid", isNullable: true }),
      new TableColumn({ name: "version", type: "integer", default: 1 }),
    ]);
    await queryRunner.addColumn("book_titles", new TableColumn({ name: "version", type: "integer", default: 1 }));
    await queryRunner.createIndex("book_copies", new TableIndex({ name: "uq_book_copies_rfid", columnNames: ["rfid"], isUnique: true, where: "rfid IS NOT NULL" }));
    await queryRunner.createForeignKey("book_copies", new TableForeignKey({ name: "fk_book_copies_shelf", columnNames: ["shelf_location_id"], referencedTableName: "shelf_locations", referencedColumnNames: ["id"], onDelete: "RESTRICT" }));
    await queryRunner.query('ALTER TABLE "book_copies" ADD CONSTRAINT "fk_book_copies_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT NOT VALID');
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "book_copies" DROP CONSTRAINT IF EXISTS "fk_book_copies_branch"');
    const table = await queryRunner.getTable("book_copies");
    const shelfFk = table?.foreignKeys.find(x => x.name === "fk_book_copies_shelf"); if (shelfFk) await queryRunner.dropForeignKey("book_copies", shelfFk);
    await queryRunner.dropIndex("book_copies", "uq_book_copies_rfid");
    await queryRunner.dropColumns("book_copies", ["rfid", "shelf_location_id", "version"]);
    await queryRunner.dropColumn("book_titles", "version");
    await queryRunner.dropTable("shelf_locations", true); await queryRunner.dropTable("branches", true);
  }
}
