import { readFileSync } from "fs";
import { join } from "path";
import { buildTypeOrmOptions } from "./typeorm-module.options";

describe("runtime readiness", () => {
  it("never lets Nest synchronize a migration-managed schema", () => {
    const config = { get: (key: string) => ({ "database.host": "db", "database.port": 5432, "database.name": "library", "database.user": "user", "database.password": "pass", "app.nodeEnv": "development" } as any)[key] };
    expect(buildTypeOrmOptions(config as any).synchronize).toBe(false);
  });
  it("uses the actual Nest output path in production", () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
    expect(pkg.scripts["start:prod"]).toBe("node dist/src/main.js");
  });
  it("installs PostgreSQL tools and migrates before Docker development startup", () => {
    expect(readFileSync(join(process.cwd(), "Dockerfile"), "utf8")).toContain("postgresql-client");
    expect(readFileSync(join(process.cwd(), "..", "docker-compose.yml"), "utf8")).toContain("npm run migration:run && npm run start:dev");
  });
  it("keeps local dependencies and secrets out of the Docker build context", () => {
    const ignored = readFileSync(join(process.cwd(), ".dockerignore"), "utf8");
    expect(ignored).toContain("node_modules");
    expect(ignored).toContain(".env");
  });
  it("pins patched transitive parser and upload dependencies", () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
    expect(pkg.overrides).toMatchObject({ multer: "2.2.0", "js-yaml": "4.2.0" });
  });
});
