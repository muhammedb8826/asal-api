import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from './config.interface';
import * as entities from 'src/entities';

export const createDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbConfig = configService.get<DatabaseConfig>('database');

  return {
    type: 'postgres',
    host: dbConfig?.host,
    port: dbConfig?.port,
    username: dbConfig?.username,
    password: dbConfig?.password,
    database: dbConfig?.database,
    entities: Object.values(entities),
    synchronize: false, // Temporarily disabled to prevent schema conflicts
    logging: dbConfig?.logging ?? ['error'], // Log only errors by default
    migrations: dbConfig?.migrations ? ['dist/migrations/*.js'] : undefined,
    migrationsRun: dbConfig?.migrationsRun || false,
    extra: {
      connectionLimit: dbConfig?.poolSize || 10, // Connection pool size
    },
    // Enable SSL in production if needed
    ssl: dbConfig?.ssl ? { rejectUnauthorized: false } : undefined,
  };
};
