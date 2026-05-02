import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

export function buildSequelizeOptions(
  config: ConfigService,
): SequelizeModuleOptions {
  return {
    dialect: 'mysql',
    host: config.getOrThrow<string>('DB_HOST'),
    port: Number(config.getOrThrow<string>('DB_PORT')),
    username: config.getOrThrow<string>('DB_USER'),
    password: config.get<string>('DB_PASS') ?? '',
    database: config.getOrThrow<string>('DB_NAME'),
    autoLoadModels: true,
    synchronize: false,
    logging:
      config.get<string>('NODE_ENV') === 'development' ? console.log : false,
  };
}
