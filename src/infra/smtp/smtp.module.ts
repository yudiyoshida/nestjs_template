import { DynamicModule, ForwardReference, Module, Provider, Type } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { isSmtpVendor, SmtpVendor } from 'src/infra/infra-vendors';
import { TOKENS } from 'src/core/di/token';
import { SmtpFakeAdapterGateway } from './adapters/fake/smtp-fake.gateway';
import { SmtpNodemailerAdapterGateway } from './adapters/nodemailer/smtp-nodemailer.gateway';
import { ISmtpGateway } from './smtp.gateway';

type SmtpAdapterBinding = {
  class: Type<ISmtpGateway>;
  modules: Array<Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  providers: Provider[];
};

const SMTP_ADAPTERS: Record<SmtpVendor, SmtpAdapterBinding> = {
  [SmtpVendor.Fake]: {
    class: SmtpFakeAdapterGateway,
    modules: [],
    providers: [],
  },
  [SmtpVendor.Nodemailer]: {
    class: SmtpNodemailerAdapterGateway,
    modules: [ConfigModule],
    providers: [],
  },
};

@Module({})
export class SmtpModule {
  static register(): DynamicModule {
    const vendor = process.env.NODE_ENV === Environment.Test
      ? SmtpVendor.Fake
      : process.env.SMTP_VENDOR;
    const binding = isSmtpVendor(vendor)
      ? SMTP_ADAPTERS[vendor]
      : undefined;

    if (!binding) {
      throw new Error(`Invalid SMTP_VENDOR "${vendor ?? ''}"`);
    }

    return {
      module: SmtpModule,
      imports: [
        ...binding.modules,
      ],
      providers: [
        ...binding.providers,
        {
          provide: TOKENS.SmtpGateway,
          useClass: binding.class,
        },
      ],
      exports: [
        TOKENS.SmtpGateway,
      ],
    };
  }
}
