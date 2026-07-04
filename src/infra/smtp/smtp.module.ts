import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { SmtpFakeAdapterGateway } from './adapters/fake/smtp-fake.gateway';
import { SmtpNodemailerAdapterGateway } from './adapters/nodemailer/smtp-nodemailer.gateway';

@Module({})
export class SmtpModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: SmtpModule,
      imports: [
        ConfigModule,
      ],
      providers: [
        {
          provide: TOKENS.SmtpGateway,
          useClass: isTest ? SmtpFakeAdapterGateway : SmtpNodemailerAdapterGateway,
        },
      ],
      exports: [
        TOKENS.SmtpGateway,
      ],
    };
  }
}
