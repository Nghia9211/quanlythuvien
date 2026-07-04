import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from "typeorm";
export class CreateIdentityAuthentication1720000003000 implements MigrationInterface {
  name = "CreateIdentityAuthentication1720000003000";
  async up(queryRunner: QueryRunner) {
    await queryRunner.changeColumn("user_accounts", "reader_id", new TableColumn({ name: "reader_id", type: "uuid", isNullable: true }));
    await queryRunner.addColumns("user_accounts", [
      new TableColumn({ name: "failed_login_attempts", type: "integer", default: 0 }),
      new TableColumn({ name: "locked_until", type: "timestamptz", isNullable: true }),
      new TableColumn({ name: "last_login_at", type: "timestamptz", isNullable: true }),
      new TableColumn({ name: "password_changed_at", type: "timestamptz", isNullable: true }),
    ]);
    await queryRunner.createTable(new Table({ name: "auth_sessions", columns: [
      { name: "id", type: "uuid", isPrimary: true }, { name: "account_id", type: "uuid" },
      { name: "refresh_token_hash", type: "varchar", length: "64" }, { name: "expires_at", type: "timestamptz" },
      { name: "rotated_at", type: "timestamptz", isNullable: true }, { name: "revoked_at", type: "timestamptz", isNullable: true },
      { name: "created_at", type: "timestamptz", default: "now()" },
    ] }), true);
    await queryRunner.createForeignKey("auth_sessions", new TableForeignKey({ name: "fk_auth_sessions_account", columnNames: ["account_id"], referencedTableName: "user_accounts", referencedColumnNames: ["id"], onDelete: "CASCADE" }));
    await queryRunner.createIndex("auth_sessions", new TableIndex({ name: "idx_auth_sessions_account_active", columnNames: ["account_id", "revoked_at"] }));
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.dropTable("auth_sessions", true);
    await queryRunner.dropColumns("user_accounts", ["failed_login_attempts", "locked_until", "last_login_at", "password_changed_at"]);
    await queryRunner.changeColumn("user_accounts", "reader_id", new TableColumn({ name: "reader_id", type: "uuid" }));
  }
}
