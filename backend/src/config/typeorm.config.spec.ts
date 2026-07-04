import typeormDataSource from "./typeorm.config";

describe("TypeORM migration configuration", () => {
  it("loads migrations from the shared database/migrations directory", () => {
    const configured = typeormDataSource.options.migrations ?? [];
    const migrations = Array.isArray(configured) ? configured : [configured];
    expect(migrations.map(String).join(" ")).toContain("database");
    expect(migrations.map(String).join(" ")).toContain("migrations");
  });
});
