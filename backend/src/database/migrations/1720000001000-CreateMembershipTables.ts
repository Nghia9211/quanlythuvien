import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateMembershipTables1720000001000 implements MigrationInterface {
  name = "CreateMembershipTables1720000001000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "readers",
      columns: [
        { name: "id", type: "uuid", isPrimary: true },
        { name: "full_name", type: "varchar", length: "200" },
        { name: "date_of_birth", type: "date" },
        { name: "email", type: "varchar", length: "320" },
        { name: "phone", type: "varchar", length: "20", isNullable: true },
        { name: "identity_number", type: "varchar", length: "20" },
        { name: "address", type: "varchar", length: "500", isNullable: true },
        {
          name: "status", type: "enum", enumName: "reader_status_enum",
          enum: ["ACTIVE", "RESTRICTED", "INACTIVE"], default: "'ACTIVE'",
        },
        { name: "version", type: "integer", default: 1 },
        { name: "created_at", type: "timestamptz", default: "now()" },
        { name: "updated_at", type: "timestamptz", default: "now()" },
      ],
    }), true);
    await queryRunner.createIndices("readers", [
      new TableIndex({ name: "uq_readers_email", columnNames: ["email"], isUnique: true }),
      new TableIndex({ name: "uq_readers_identity_number", columnNames: ["identity_number"], isUnique: true }),
    ]);

    await queryRunner.createTable(new Table({
      name: "library_cards",
      columns: [
        { name: "id", type: "uuid", isPrimary: true },
        { name: "reader_id", type: "uuid" },
        { name: "card_number", type: "varchar", length: "50" },
        {
          name: "status", type: "enum", enumName: "library_card_status_enum",
          enum: ["ACTIVE", "LOCKED", "EXPIRED"], default: "'ACTIVE'",
        },
        { name: "issued_at", type: "timestamptz" },
        { name: "expires_at", type: "timestamptz" },
        { name: "lock_reason", type: "varchar", length: "500", isNullable: true },
        { name: "created_at", type: "timestamptz", default: "now()" },
        { name: "updated_at", type: "timestamptz", default: "now()" },
      ],
    }), true);
    await queryRunner.createIndices("library_cards", [
      new TableIndex({ name: "uq_library_cards_reader", columnNames: ["reader_id"], isUnique: true }),
      new TableIndex({ name: "uq_library_cards_number", columnNames: ["card_number"], isUnique: true }),
    ]);
    await queryRunner.createForeignKey("library_cards", new TableForeignKey({
      name: "fk_library_cards_reader", columnNames: ["reader_id"],
      referencedTableName: "readers", referencedColumnNames: ["id"], onDelete: "RESTRICT",
    }));

    await queryRunner.createTable(new Table({
      name: "user_accounts",
      columns: [
        { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
        { name: "reader_id", type: "uuid" },
        { name: "username", type: "varchar", length: "100" },
        { name: "password_hash", type: "varchar", length: "100" },
        { name: "role", type: "varchar", length: "30", default: "'reader'" },
        { name: "is_active", type: "boolean", default: true },
        { name: "created_at", type: "timestamptz", default: "now()" },
        { name: "updated_at", type: "timestamptz", default: "now()" },
      ],
    }), true);
    await queryRunner.createIndices("user_accounts", [
      new TableIndex({ name: "uq_user_accounts_reader", columnNames: ["reader_id"], isUnique: true }),
      new TableIndex({ name: "uq_user_accounts_username", columnNames: ["username"], isUnique: true }),
    ]);
    await queryRunner.createForeignKey("user_accounts", new TableForeignKey({
      name: "fk_user_accounts_reader", columnNames: ["reader_id"],
      referencedTableName: "readers", referencedColumnNames: ["id"], onDelete: "RESTRICT",
    }));

    await queryRunner.createTable(new Table({
      name: "audit_logs",
      columns: [
        { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
        { name: "actor_id", type: "uuid" },
        { name: "action", type: "varchar", length: "100" },
        { name: "aggregate_type", type: "varchar", length: "100" },
        { name: "aggregate_id", type: "uuid" },
        { name: "reason", type: "varchar", length: "500", isNullable: true },
        { name: "details", type: "jsonb", default: "'{}'::jsonb" },
        { name: "created_at", type: "timestamptz", default: "now()" },
      ],
    }), true);
    await queryRunner.createIndices("audit_logs", [
      new TableIndex({ name: "idx_audit_logs_actor", columnNames: ["actor_id"] }),
      new TableIndex({ name: "idx_audit_logs_aggregate", columnNames: ["aggregate_type", "aggregate_id"] }),
    ]);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("audit_logs", true);
    await queryRunner.dropTable("user_accounts", true);
    await queryRunner.dropTable("library_cards", true);
    await queryRunner.dropTable("readers", true);
  }
}
