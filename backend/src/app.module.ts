import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import appConfig from "./config/app.config";
import databaseConfig from "./config/database.config";
import jwtConfig from "./config/jwt.config";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { MembershipModule } from "./modules/membership/membership.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { CirculationModule } from "./modules/circulation/circulation.module";
import { ReservationModule } from "./modules/reservation/reservation.module";
import { BillingModule } from "./modules/billing/billing.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { ReportingModule } from "./modules/reporting/reporting.module";
import { AdministrationModule } from "./modules/administration/administration.module";
import { BackupModule } from "./modules/backup/backup.module";
import { buildTypeOrmOptions } from "./config/typeorm-module.options";

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
      useFactory: buildTypeOrmOptions,
    }),

    // Scheduler - dùng cho @Cron (tính phí quá hạn, etc.)
    ScheduleModule.forRoot(),

    CatalogModule,
    MembershipModule,
    IdentityModule,
    CirculationModule,
    ReservationModule,
    BillingModule,
    InventoryModule,
    ReportingModule,
    AdministrationModule,
    BackupModule,

  ],
})
export class AppModule {}
