import { DynamicModule, ForwardReference, Global, Module, Provider, Type } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { CacheVendor, isCacheVendor } from 'src/infra/infra-vendors';
import { TOKENS } from 'src/core/di/token';
import { CacheFakeAdapterGateway } from './adapters/fake/cache-fake.gateway';
import { CacheRedisAdapterGateway } from './adapters/redis/cache-redis.gateway';
import { ICacheGateway } from './cache.gateway';

type CacheAdapterBinding = {
  class: Type<ICacheGateway>;
  modules: Array<Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  providers: Provider[];
};

const CACHE_ADAPTERS: Record<CacheVendor, CacheAdapterBinding> = {
  [CacheVendor.Fake]: {
    class: CacheFakeAdapterGateway,
    modules: [],
    providers: [],
  },
  [CacheVendor.Redis]: {
    class: CacheRedisAdapterGateway,
    modules: [ConfigModule],
    providers: [],
  },
};

@Global()
@Module({})
export class CacheModule {
  static register(): DynamicModule {
    const vendor = process.env.NODE_ENV === Environment.Test
      ? CacheVendor.Fake
      : process.env.CACHE_VENDOR;
    const binding = isCacheVendor(vendor)
      ? CACHE_ADAPTERS[vendor]
      : undefined;

    if (!binding) {
      throw new Error(`Invalid CACHE_VENDOR "${vendor ?? ''}"`);
    }

    return {
      module: CacheModule,
      imports: [
        ...binding.modules,
      ],
      providers: [
        ...binding.providers,
        {
          provide: TOKENS.CacheGateway,
          useClass: binding.class,
        },
      ],
      exports: [
        TOKENS.CacheGateway,
      ],
    };
  }
}
