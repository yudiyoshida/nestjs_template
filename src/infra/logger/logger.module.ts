import { DynamicModule, ForwardReference, Global, Module, Provider, Type } from '@nestjs/common';
import { Environment } from 'src/core/config/environment.enum';
import { isLoggerVendor, LoggerVendor } from 'src/infra/infra-vendors';
import { TOKENS } from 'src/core/di/token';
import { LoggerFakeAdapterGateway } from './adapters/fake/logger-fake.gateway';
import { LoggerWinstonAdapterGateway } from './adapters/winston/logger-winston.gateway';
import { ILoggerGateway } from './logger.gateway';

type LoggerAdapterBinding = {
  class: Type<ILoggerGateway>;
  modules: Array<Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  providers: Provider[];
};

const LOGGER_ADAPTERS: Record<LoggerVendor, LoggerAdapterBinding> = {
  [LoggerVendor.Fake]: {
    class: LoggerFakeAdapterGateway,
    modules: [],
    providers: [],
  },
  [LoggerVendor.Winston]: {
    class: LoggerWinstonAdapterGateway,
    modules: [],
    providers: [],
  },
};

@Global()
@Module({})
export class LoggerModule {
  static register(): DynamicModule {
    const vendor = process.env.NODE_ENV === Environment.Test
      ? LoggerVendor.Fake
      : process.env.LOGGER_VENDOR;
    const binding = isLoggerVendor(vendor)
      ? LOGGER_ADAPTERS[vendor]
      : undefined;

    if (!binding) {
      throw new Error(`Invalid LOGGER_VENDOR "${vendor ?? ''}"`);
    }

    return {
      module: LoggerModule,
      imports: [
        ...binding.modules,
      ],
      providers: [
        ...binding.providers,
        {
          provide: TOKENS.LoggerGateway,
          useClass: binding.class,
        },
      ],
      exports: [
        TOKENS.LoggerGateway,
      ],
    };
  }
}
