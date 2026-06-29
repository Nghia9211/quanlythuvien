import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  name: process.env.DB_NAME || 'dgm_library',
  user: process.env.DB_USER || 'dgm_user',
  password: process.env.DB_PASSWORD || 'dgm_pass',
}));
