import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { CacheFakeAdapterGateway } from './adapters/fake/cache-fake.gateway';
import { CacheRedisAdapterGateway } from './adapters/redis/cache-redis.gateway';
import { CacheModule } from './cache.module';

describe('CacheModule - Unit tests', () => {
  let originalNodeEnv: string | undefined;
  let originalCacheVendor: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalCacheVendor = process.env.CACHE_VENDOR;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalCacheVendor === undefined) {
      delete process.env.CACHE_VENDOR;
    }
    else {
      process.env.CACHE_VENDOR = originalCacheVendor;
    }
  });

  describe('register', () => {
    describe('Happy path', () => {
      it('should use CacheFakeAdapterGateway when NODE_ENV is test even with CACHE_VENDOR set to redis', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;
        process.env.CACHE_VENDOR = 'redis';

        // Act
        const result = CacheModule.register();

        // Assert
        expect(result.imports).toEqual([]);
        expect(result.providers).toEqual([
          { provide: TOKENS.CacheGateway, useClass: CacheFakeAdapterGateway },
        ]);
      });

      it('should use CacheFakeAdapterGateway when NODE_ENV is production and CACHE_VENDOR is fake', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.CACHE_VENDOR = 'fake';

        // Act
        const result = CacheModule.register();

        // Assert
        expect(result.imports).toEqual([]);
        expect(result.providers).toEqual([
          { provide: TOKENS.CacheGateway, useClass: CacheFakeAdapterGateway },
        ]);
      });

      it('should use CacheRedisAdapterGateway when NODE_ENV is production and CACHE_VENDOR is redis', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.CACHE_VENDOR = 'redis';

        // Act
        const result = CacheModule.register();

        // Assert
        expect(result.imports).toEqual([ConfigModule]);
        expect(result.providers).toEqual([
          { provide: TOKENS.CacheGateway, useClass: CacheRedisAdapterGateway },
        ]);
      });

      it('should return the module with empty imports and the gateway token exported when NODE_ENV is test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;
        process.env.CACHE_VENDOR = 'redis';

        // Act
        const result = CacheModule.register();

        // Assert
        expect(result.module).toBe(CacheModule);
        expect(result.imports).toEqual([]);
        expect(result.exports).toEqual([TOKENS.CacheGateway]);
      });
    });

    describe('Error path', () => {
      it('should throw when NODE_ENV is production and CACHE_VENDOR is invalid', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.CACHE_VENDOR = 'memcached';

        // Act & Assert
        expect(() => CacheModule.register()).toThrow('Invalid CACHE_VENDOR "memcached"');
      });

      it('should throw when NODE_ENV is production and CACHE_VENDOR is missing', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        delete process.env.CACHE_VENDOR;

        // Act & Assert
        expect(() => CacheModule.register()).toThrow('Invalid CACHE_VENDOR ""');
      });
    });

    describe('Edge cases', () => {
      it('should use CacheRedisAdapterGateway when NODE_ENV is undefined and CACHE_VENDOR is redis', () => {
        // Arrange
        delete process.env.NODE_ENV;
        process.env.CACHE_VENDOR = 'redis';

        // Act
        const result = CacheModule.register();

        // Assert
        expect(result.imports).toEqual([ConfigModule]);
        expect(result.providers).toEqual([
          { provide: TOKENS.CacheGateway, useClass: CacheRedisAdapterGateway },
        ]);
      });
    });
  });
});
