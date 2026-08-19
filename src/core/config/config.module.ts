import Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { Environment } from './environment.enum';
import {
  CACHE_VENDORS,
  CacheVendor,
  CEP_LOOKUP_VENDORS,
  CepLookupVendor,
  CNPJ_LOOKUP_VENDORS,
  CnpjLookupVendor,
  LOGGER_VENDORS,
  SMTP_VENDORS,
  SmtpVendor,
  UPLOAD_FILE_VENDORS,
  UploadFileVendor,
} from 'src/infra/infra-vendors';

function requiredWhen(vendorEnvKey: string, vendor: string, schema: Joi.Schema = Joi.string()) {
  return Joi.when(vendorEnvKey, {
    is: vendor,
    then: schema.required(),
    otherwise: schema.optional(),
  });
}

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: `.env.${process.env.NODE_ENV || Environment.Development}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid(...Object.values(Environment)).required(),

        PORT: Joi.number().required(),
        SSL_KEY: Joi.string().required(),
        SSL_CERT: Joi.string().required(),
        SSL_CA: Joi.string().required(),

        CORS_ORIGIN: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_EXPIRES_IN: Joi.number().required(),
        DATABASE_URL: Joi.string().required(),

        UPLOAD_FILE_VENDOR: Joi.string().valid(...UPLOAD_FILE_VENDORS).required(),
        AWS_ACCESS_KEY_ID: requiredWhen('UPLOAD_FILE_VENDOR', UploadFileVendor.AwsS3),
        AWS_SECRET_ACCESS_KEY: requiredWhen('UPLOAD_FILE_VENDOR', UploadFileVendor.AwsS3),
        AWS_REGION: requiredWhen('UPLOAD_FILE_VENDOR', UploadFileVendor.AwsS3),
        AWS_BUCKET_NAME: requiredWhen('UPLOAD_FILE_VENDOR', UploadFileVendor.AwsS3),

        SMTP_VENDOR: Joi.string().valid(...SMTP_VENDORS).required(),
        SMTP_HOST: requiredWhen('SMTP_VENDOR', SmtpVendor.Nodemailer),
        SMTP_PORT: requiredWhen('SMTP_VENDOR', SmtpVendor.Nodemailer, Joi.number()),
        SMTP_TO: requiredWhen('SMTP_VENDOR', SmtpVendor.Nodemailer),
        SMTP_FROM: requiredWhen('SMTP_VENDOR', SmtpVendor.Nodemailer),
        SMTP_USERNAME: requiredWhen('SMTP_VENDOR', SmtpVendor.Nodemailer),
        SMTP_PASSWORD: requiredWhen('SMTP_VENDOR', SmtpVendor.Nodemailer),

        CACHE_VENDOR: Joi.string().valid(...CACHE_VENDORS).required(),
        REDIS_URL: requiredWhen('CACHE_VENDOR', CacheVendor.Redis),

        CEP_LOOKUP_VENDOR: Joi.string().valid(...CEP_LOOKUP_VENDORS).required(),
        VIACEP_API_URL: requiredWhen('CEP_LOOKUP_VENDOR', CepLookupVendor.Viacep),

        CNPJ_LOOKUP_VENDOR: Joi.string().valid(...CNPJ_LOOKUP_VENDORS).required(),
        CNPJA_API_URL: requiredWhen('CNPJ_LOOKUP_VENDOR', CnpjLookupVendor.Cnpja),
        CNPJA_API_KEY: requiredWhen('CNPJ_LOOKUP_VENDOR', CnpjLookupVendor.Cnpja),

        LOGGER_VENDOR: Joi.string().valid(...LOGGER_VENDORS).required(),
      }),
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
