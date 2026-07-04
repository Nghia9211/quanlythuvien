import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

/**
 * DataSource dành riêng cho TypeORM CLI (migration:generate, migration:run).
 * Không phải config của NestJS app — NestJS dùng TypeOrmModule.forRootAsync trong AppModule.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER || 'dgm_user',
  password: process.env.DB_PASSWORD || 'dgm_password',
  database: process.env.DB_NAME || 'dgm_library',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
