import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_SECRET || 'development_access_secret_change_before_production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'development_refresh_secret_change_before_production',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '7d',
}));
