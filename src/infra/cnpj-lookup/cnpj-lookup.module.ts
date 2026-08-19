import { HttpModule } from '@nestjs/axios';
import { DynamicModule, ForwardReference, Module, Provider, Type } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { CnpjLookupVendor, isCnpjLookupVendor } from 'src/infra/infra-vendors';
import { TOKENS } from 'src/core/di/token';
import { CnpjLookupCnpjaAdapterGateway } from './adapters/cnpja/cnpj-lookup-cnpja.gateway';
import { CnpjLookupFakeAdapterGateway } from './adapters/fake/cnpj-lookup-fake.gateway';
import { ICnpjLookupGateway } from './cnpj-lookup.gateway';

type CnpjLookupAdapterBinding = {
  class: Type<ICnpjLookupGateway>;
  modules: Array<Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  providers: Provider[];
};

const CNPJ_LOOKUP_ADAPTERS: Record<CnpjLookupVendor, CnpjLookupAdapterBinding> = {
  [CnpjLookupVendor.Fake]: {
    class: CnpjLookupFakeAdapterGateway,
    modules: [],
    providers: [],
  },
  [CnpjLookupVendor.Cnpja]: {
    class: CnpjLookupCnpjaAdapterGateway,
    modules: [ConfigModule, HttpModule],
    providers: [],
  },
};

@Module({})
export class CnpjLookupModule {
  static register(): DynamicModule {
    const vendor = process.env.NODE_ENV === Environment.Test
      ? CnpjLookupVendor.Fake
      : process.env.CNPJ_LOOKUP_VENDOR;
    const binding = isCnpjLookupVendor(vendor)
      ? CNPJ_LOOKUP_ADAPTERS[vendor]
      : undefined;

    if (!binding) {
      throw new Error(`Invalid CNPJ_LOOKUP_VENDOR "${vendor ?? ''}"`);
    }

    return {
      module: CnpjLookupModule,
      imports: [
        ...binding.modules,
      ],
      providers: [
        ...binding.providers,
        {
          provide: TOKENS.CnpjLookupGateway,
          useClass: binding.class,
        },
      ],
      exports: [
        TOKENS.CnpjLookupGateway,
      ],
    };
  }
}
