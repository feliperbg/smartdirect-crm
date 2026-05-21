import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { SacModule } from './modules/sac/sac.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const shouldUseSsl = (configService: ConfigService) =>
  configService.get('DB_SSL') === 'true' ||
  Boolean(configService.get('DATABASE_URL'));

export const isRedisEnabled = () =>
  process.env.DISABLE_REDIS !== 'true' &&
  Boolean(
    process.env.REDIS_URL ||
      process.env.REDIS_HOST ||
      process.env.REDIS_PASSWORD,
  );

const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const common: TypeOrmModuleOptions = {
    type: 'postgres',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: configService.get('DB_SYNCHRONIZE') !== 'false',
    logging: false,
  };

  const ssl = shouldUseSsl(configService)
    ? { rejectUnauthorized: false }
    : undefined;

  const databaseUrl = configService.get<string>('DATABASE_URL');
  if (databaseUrl) {
    return {
      ...common,
      url: databaseUrl,
      ssl,
    };
  }

  return {
    ...common,
    host: configService.get<string>('DB_HOST'),
    port: parseNumber(configService.get('DB_PORT'), 5432),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    ssl,
  };
};

const getRedisConfig = (configService: ConfigService) => {
  const redisUrl = configService.get<string>('REDIS_URL');
  if (redisUrl) {
    const parsed = new URL(redisUrl);

    return {
      host: parsed.hostname,
      port: parseNumber(
        parsed.port,
        parsed.protocol === 'rediss:' ? 6380 : 6379,
      ),
      username: parsed.username
        ? decodeURIComponent(parsed.username)
        : undefined,
      password: parsed.password
        ? decodeURIComponent(parsed.password)
        : undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    };
  }

  return {
    host: configService.get<string>('REDIS_HOST') ?? 'localhost',
    port: parseNumber(configService.get('REDIS_PORT'), 6379),
    password: configService.get<string>('REDIS_PASSWORD'),
  };
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    ...(isRedisEnabled()
      ? [
          BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
              redis: getRedisConfig(configService),
            }),
            inject: [ConfigService],
          }),
        ]
      : []),
    // Configuração de Rate Limit global (100 requisições por minuto por IP)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    UsersModule,
    TenantsModule,
    PipelineModule,
    SacModule,
    CampaignsModule,
  ],
  providers: [
    // Ativando o limitador de requisições (rate-limit) globalmente
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
