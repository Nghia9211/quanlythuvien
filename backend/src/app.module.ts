import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { join } from "path";
import appConfig from "./config/app.config";
import databaseConfig from "./config/database.config";
import jwtConfig from "./config/jwt.config";

@Module({
  imports: [
    // Config module - load .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      load: [appConfig, databaseConfig, jwtConfig],
    }),

    // TypeORM - kết nối PostgreSQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("database.host"),
        port: config.get<number>("database.port"),
        database: config.get("database.name"),
        username: config.get("database.user"),
        password: config.get("database.password"),
        entities: [join(__dirname, "**", "*.entity.{ts,js}")],
        migrations: [join(__dirname, "migrations", "*.{ts,js}")],
        synchronize: config.get("app.nodeEnv") === "development", // CHỈ dùng dev!
        logging: config.get("app.nodeEnv") === "development",
        autoLoadEntities: true,
      }),
    }),

    // Scheduler - dùng cho @Cron (tính phí quá hạn, etc.)
    ScheduleModule.forRoot(),

    // TODO: import các feature modules ở đây
    // AuthModule,
    // CatalogModule,
    // MembershipModule,
  ],
})
export class AppModule {}
