import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";

export function buildTypeOrmOptions(config: Pick<ConfigService, "get">): TypeOrmModuleOptions {
  return {
    type: "postgres",
    host: config.get("database.host"),
    port: config.get<number>("database.port"),
    database: config.get("database.name"),
    username: config.get("database.user"),
    password: config.get("database.password"),
    entities: [join(__dirname, "..", "**", "*.{orm-,}entity.{ts,js}")],
    migrations: [join(__dirname, "..", "database", "migrations", "*.{ts,js}")],
    synchronize: false,
    logging: config.get("app.nodeEnv") === "development",
    autoLoadEntities: true,
  };
}
