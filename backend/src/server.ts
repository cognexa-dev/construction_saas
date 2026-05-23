import 'reflect-metadata';
import app from './app';
import { AppDataSource } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const masked = dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
      logger.info(`Connecting via DATABASE_URL: ${masked}`);
    } else {
      logger.warn(`DATABASE_URL not set — connecting to ${env.db.host}:${env.db.port}/${env.db.name}`);
    }

    await AppDataSource.initialize();
    logger.info('Database connected successfully');

    app.listen(env.port, () => {
      logger.info(`Server running on http://localhost:${env.port}`);
      logger.info(`API available at http://localhost:${env.port}${env.apiPrefix}`);
      logger.info(`Environment: ${env.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

bootstrap();
