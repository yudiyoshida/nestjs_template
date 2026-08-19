import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Environment } from './environment.enum';
import type {
  CacheVendor,
  CepLookupVendor,
  CnpjLookupVendor,
  LoggerVendor,
  SmtpVendor,
  UploadFileVendor,
} from 'src/infra/infra-vendors';

@Injectable()
export class ConfigService {
  constructor(private readonly nestConfigService: NestConfigService) {}

  // environment
  get nodeEnv(): Environment {
    return this.nestConfigService.get<Environment>('NODE_ENV')!;
  }
  get isDevelopment(): boolean {
    return this.nodeEnv === Environment.Development;
  }
  get isProduction(): boolean {
    return this.nodeEnv === Environment.Production;
  }
  get isTest(): boolean {
    return this.nodeEnv === Environment.Test;
  }

  // server
  get port(): number {
    return this.nestConfigService.get<number>('PORT')!;
  }
  get sslKeyPath(): string {
    return this.nestConfigService.get<string>('SSL_KEY')!;
  }
  get sslCertPath(): string {
    return this.nestConfigService.get<string>('SSL_CERT')!;
  }
  get sslCaPath(): string {
    return this.nestConfigService.get<string>('SSL_CA')!;
  }

  // cors
  get corsOrigin(): string {
    return this.nestConfigService.get<string>('CORS_ORIGIN')!;
  }

  // jwt
  get jwtSecret(): string {
    return this.nestConfigService.get<string>('JWT_SECRET')!;
  }
  get jwtExpiresIn(): string {
    return this.nestConfigService.get<string>('JWT_EXPIRES_IN')!;
  }
  get refreshTokenSecret(): string {
    return this.nestConfigService.get<string>('REFRESH_TOKEN_SECRET')!;
  }
  get refreshTokenExpiresIn(): number {
    return this.nestConfigService.get<number>('REFRESH_TOKEN_EXPIRES_IN')!;
  }

  // database
  get databaseUrl(): string {
    return this.nestConfigService.get<string>('DATABASE_URL')!;
  }

  // upload file
  get uploadFileVendor(): UploadFileVendor {
    return this.nestConfigService.get<UploadFileVendor>('UPLOAD_FILE_VENDOR')!;
  }
  get awsAccessKeyId(): string {
    return this.nestConfigService.get<string>('AWS_ACCESS_KEY_ID')!;
  }
  get awsSecretAccessKey(): string {
    return this.nestConfigService.get<string>('AWS_SECRET_ACCESS_KEY')!;
  }
  get awsRegion(): string {
    return this.nestConfigService.get<string>('AWS_REGION')!;
  }
  get awsBucketName(): string {
    return this.nestConfigService.get<string>('AWS_BUCKET_NAME')!;
  }

  // smtp
  get smtpVendor(): SmtpVendor {
    return this.nestConfigService.get<SmtpVendor>('SMTP_VENDOR')!;
  }
  get smtpHost(): string {
    return this.nestConfigService.get<string>('SMTP_HOST')!;
  }
  get smtpPort(): number {
    return this.nestConfigService.get<number>('SMTP_PORT')!;
  }
  get smtpTo(): string {
    return this.nestConfigService.get<string>('SMTP_TO')!;
  }
  get smtpFrom(): string {
    return this.nestConfigService.get<string>('SMTP_FROM')!;
  }
  get smtpUsername(): string {
    return this.nestConfigService.get<string>('SMTP_USERNAME')!;
  }
  get smtpPassword(): string {
    return this.nestConfigService.get<string>('SMTP_PASSWORD')!;
  }

  // cache
  get cacheVendor(): CacheVendor {
    return this.nestConfigService.get<CacheVendor>('CACHE_VENDOR')!;
  }
  get redisUrl(): string {
    return this.nestConfigService.get<string>('REDIS_URL')!;
  }

  // cep lookup
  get cepLookupVendor(): CepLookupVendor {
    return this.nestConfigService.get<CepLookupVendor>('CEP_LOOKUP_VENDOR')!;
  }
  get viacepApiUrl(): string {
    return this.nestConfigService.get<string>('VIACEP_API_URL')!;
  }

  // cnpj lookup
  get cnpjLookupVendor(): CnpjLookupVendor {
    return this.nestConfigService.get<CnpjLookupVendor>('CNPJ_LOOKUP_VENDOR')!;
  }
  get cnpjaApiUrl(): string {
    return this.nestConfigService.get<string>('CNPJA_API_URL')!;
  }
  get cnpjaApiKey(): string {
    return this.nestConfigService.get<string>('CNPJA_API_KEY')!;
  }

  // logger
  get loggerVendor(): LoggerVendor {
    return this.nestConfigService.get<LoggerVendor>('LOGGER_VENDOR')!;
  }
}
