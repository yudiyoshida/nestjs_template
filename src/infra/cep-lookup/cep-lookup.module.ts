import { HttpModule } from '@nestjs/axios';
import { DynamicModule, ForwardReference, Module, Provider, Type } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { CepLookupVendor, isCepLookupVendor } from 'src/infra/infra-vendors';
import { TOKENS } from 'src/core/di/token';
import { CepLookupFakeAdapterGateway } from './adapters/fake/cep-lookup-fake.gateway';
import { CepLookupViacepAdapterGateway } from './adapters/viacep/cep-lookup-viacep.gateway';
import { ICepLookupGateway } from './cep-lookup.gateway';

type CepLookupAdapterBinding = {
  class: Type<ICepLookupGateway>;
  modules: Array<Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  providers: Provider[];
};

const CEP_LOOKUP_ADAPTERS: Record<CepLookupVendor, CepLookupAdapterBinding> = {
  [CepLookupVendor.Fake]: {
    class: CepLookupFakeAdapterGateway,
    modules: [],
    providers: [],
  },
  [CepLookupVendor.Viacep]: {
    class: CepLookupViacepAdapterGateway,
    modules: [ConfigModule, HttpModule],
    providers: [],
  },
};

@Module({})
export class CepLookupModule {
  static register(): DynamicModule {
    const vendor = process.env.NODE_ENV === Environment.Test
      ? CepLookupVendor.Fake
      : process.env.CEP_LOOKUP_VENDOR;
    const binding = isCepLookupVendor(vendor)
      ? CEP_LOOKUP_ADAPTERS[vendor]
      : undefined;

    if (!binding) {
      throw new Error(`Invalid CEP_LOOKUP_VENDOR "${vendor ?? ''}"`);
    }

    return {
      module: CepLookupModule,
      imports: [
        ...binding.modules,
      ],
      providers: [
        ...binding.providers,
        {
          provide: TOKENS.CepLookupGateway,
          useClass: binding.class,
        },
      ],
      exports: [
        TOKENS.CepLookupGateway,
      ],
    };
  }
}
