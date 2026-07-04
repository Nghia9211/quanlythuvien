import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateReservations1720000005000 implements MigrationInterface {
  name = "CreateReservations1720000005000";
  async up(q: QueryRunner) {
    await q.createTable(new Table({ name: "reservation_policies", columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "max_active_reservations", type: "integer" }, { name: "hold_hours", type: "integer" },
      { name: "effective_from", type: "timestamptz" }, { name: "is_active", type: "boolean", default: true },
    ] }), true);
    await q.createIndex("reservation_policies", new TableIndex({ name: "idx_reservation_policies_active", columnNames: ["is_active", "effective_from"] }));
    await q.query("INSERT INTO reservation_policies (id,max_active_reservations,hold_hours,effective_from,is_active) VALUES ('00000000-0000-4000-8000-000000000002',5,48,now(),true)");

    await q.createTable(new Table({ name: "reservations", columns: [
      { name: "id", type: "uuid", isPrimary: true }, { name: "reader_id", type: "uuid" }, { name: "book_title_id", type: "uuid" }, { name: "branch_id", type: "uuid" },
      { name: "status", type: "enum", enumName: "reservation_status_enum", enum: ["WAITING", "ON_HOLD", "COMPLETED", "CANCELLED", "EXPIRED"], default: "'WAITING'" },
      { name: "copy_id", type: "uuid", isNullable: true }, { name: "hold_expires_at", type: "timestamptz", isNullable: true }, { name: "cancel_reason", type: "varchar", length: "500", isNullable: true },
      { name: "version", type: "integer", default: 1 }, { name: "created_at", type: "timestamptz", default: "now()" }, { name: "updated_at", type: "timestamptz", default: "now()" },
    ] }), true);
    for (const fk of [
      new TableForeignKey({ name: "fk_reservations_reader", columnNames: ["reader_id"], referencedTableName: "readers", referencedColumnNames: ["id"], onDelete: "RESTRICT" }),
      new TableForeignKey({ name: "fk_reservations_title", columnNames: ["book_title_id"], referencedTableName: "book_titles", referencedColumnNames: ["id"], onDelete: "RESTRICT" }),
      new TableForeignKey({ name: "fk_reservations_branch", columnNames: ["branch_id"], referencedTableName: "branches", referencedColumnNames: ["id"], onDelete: "RESTRICT" }),
      new TableForeignKey({ name: "fk_reservations_copy", columnNames: ["copy_id"], referencedTableName: "book_copies", referencedColumnNames: ["id"], onDelete: "RESTRICT" }),
    ]) await q.createForeignKey("reservations", fk);
    await q.createIndex("reservations", new TableIndex({ name: "idx_reservations_queue", columnNames: ["book_title_id", "branch_id", "status", "created_at"] }));
    await q.createIndex("reservations", new TableIndex({ name: "idx_reservations_reader_status", columnNames: ["reader_id", "status"] }));
    await q.createIndex("reservations", new TableIndex({ name: "idx_reservations_expiry", columnNames: ["hold_expires_at"], where: "status = 'ON_HOLD'" }));
    await q.query("CREATE UNIQUE INDEX uq_reservations_active_reader_title_branch ON reservations (reader_id,book_title_id,branch_id) WHERE status IN ('WAITING','ON_HOLD')");

    await q.createTable(new Table({ name: "notification_outbox", columns: [
      { name: "id", type: "uuid", isPrimary: true }, { name: "reservation_id", type: "uuid" }, { name: "reader_id", type: "uuid" }, { name: "type", type: "varchar", length: "100" },
      { name: "payload", type: "jsonb" }, { name: "status", type: "enum", enumName: "notification_outbox_status_enum", enum: ["PENDING", "SENT", "FAILED"], default: "'PENDING'" },
      { name: "attempts", type: "integer", default: 0 }, { name: "next_attempt_at", type: "timestamptz", default: "now()" }, { name: "last_error", type: "varchar", length: "1000", isNullable: true },
      { name: "sent_at", type: "timestamptz", isNullable: true }, { name: "created_at", type: "timestamptz", default: "now()" },
    ] }), true);
    await q.createForeignKey("notification_outbox", new TableForeignKey({ name: "fk_notification_outbox_reservation", columnNames: ["reservation_id"], referencedTableName: "reservations", referencedColumnNames: ["id"], onDelete: "CASCADE" }));
    await q.createForeignKey("notification_outbox", new TableForeignKey({ name: "fk_notification_outbox_reader", columnNames: ["reader_id"], referencedTableName: "readers", referencedColumnNames: ["id"], onDelete: "RESTRICT" }));
    await q.createIndex("notification_outbox", new TableIndex({ name: "idx_notification_outbox_dispatch", columnNames: ["status", "next_attempt_at", "created_at"] }));
  }
  async down(q: QueryRunner) {
    await q.dropTable("notification_outbox", true);
    await q.dropTable("reservations", true);
    await q.dropTable("reservation_policies", true);
  }
}
