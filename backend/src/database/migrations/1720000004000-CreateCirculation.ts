import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";
export class CreateCirculation1720000004000 implements MigrationInterface {
  name = "CreateCirculation1720000004000";
  async up(q: QueryRunner) {
    await q.createTable(new Table({ name: "loan_policies", columns: [
      { name: "id", type: "uuid", isPrimary: true }, { name: "max_active_items", type: "integer" }, { name: "loan_days", type: "integer" },
      { name: "max_renewals", type: "integer" }, { name: "renewal_days", type: "integer" }, { name: "effective_from", type: "timestamptz" }, { name: "is_active", type: "boolean", default: true },
    ] }), true);
    await q.createIndex("loan_policies", new TableIndex({ name: "idx_loan_policies_active", columnNames: ["is_active", "effective_from"] }));
    await q.query(`INSERT INTO loan_policies (id,max_active_items,loan_days,max_renewals,renewal_days,effective_from,is_active) VALUES ('00000000-0000-4000-8000-000000000001',5,14,2,14,now(),true)`);
    await q.createTable(new Table({ name: "loans", columns: [
      { name: "id", type: "uuid", isPrimary: true }, { name: "reader_id", type: "uuid" }, { name: "card_id", type: "uuid" }, { name: "branch_id", type: "uuid" }, { name: "staff_id", type: "uuid" },
      { name: "borrowed_at", type: "timestamptz" }, { name: "status", type: "enum", enumName: "loan_status_enum", enum: ["OPEN","CLOSED"], default: "'OPEN'" }, { name: "version", type: "integer", default: 1 },
      { name: "created_at", type: "timestamptz", default: "now()" }, { name: "updated_at", type: "timestamptz", default: "now()" },
    ] }), true);
    await q.createIndex("loans", new TableIndex({ name: "idx_loans_reader_status", columnNames: ["reader_id","status"] }));
    for (const fk of [
      new TableForeignKey({ name: "fk_loans_reader", columnNames: ["reader_id"], referencedTableName: "readers", referencedColumnNames: ["id"] }),
      new TableForeignKey({ name: "fk_loans_card", columnNames: ["card_id"], referencedTableName: "library_cards", referencedColumnNames: ["id"] }),
      new TableForeignKey({ name: "fk_loans_branch", columnNames: ["branch_id"], referencedTableName: "branches", referencedColumnNames: ["id"] }),
      new TableForeignKey({ name: "fk_loans_staff", columnNames: ["staff_id"], referencedTableName: "user_accounts", referencedColumnNames: ["id"] }),
    ]) await q.createForeignKey("loans", fk);
    await q.createTable(new Table({ name: "loan_items", columns: [
      { name: "id", type: "uuid", isPrimary: true }, { name: "loan_id", type: "uuid" }, { name: "copy_id", type: "uuid" }, { name: "book_title_id", type: "uuid" },
      { name: "due_at", type: "timestamptz" }, { name: "status", type: "enum", enumName: "loan_item_status_enum", enum: ["ON_LOAN","RETURNED","LOST"] },
      { name: "returned_at", type: "timestamptz", isNullable: true }, { name: "return_condition", type: "enum", enumName: "return_condition_enum", enum: ["NORMAL","DAMAGED","LOST"], isNullable: true },
      { name: "overdue_days", type: "integer", default: 0 }, { name: "renewal_count", type: "integer", default: 0 }, { name: "version", type: "integer", default: 1 },
    ] }), true);
    await q.createIndex("loan_items", new TableIndex({ name: "idx_loan_items_copy_status", columnNames: ["copy_id","status"] }));
    await q.query(`CREATE UNIQUE INDEX uq_loan_items_open_copy ON loan_items (copy_id) WHERE status = 'ON_LOAN'`);
    await q.createForeignKey("loan_items", new TableForeignKey({ name: "fk_loan_items_loan", columnNames: ["loan_id"], referencedTableName: "loans", referencedColumnNames: ["id"] }));
    await q.createForeignKey("loan_items", new TableForeignKey({ name: "fk_loan_items_copy", columnNames: ["copy_id"], referencedTableName: "book_copies", referencedColumnNames: ["id"] }));
  }
  async down(q: QueryRunner) { await q.dropTable("loan_items", true); await q.dropTable("loans", true); await q.dropTable("loan_policies", true); }
}
