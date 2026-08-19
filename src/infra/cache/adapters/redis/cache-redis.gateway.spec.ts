import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { createClient } from 'redis';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { CacheRedisAdapterGateway } from './cache-redis.gateway';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('CacheRedisAdapterGateway - Unit tests', () => {
  const REDIS_URL = 'redis://user:secret@localhost:6379';

  let sut: CacheRedisAdapterGateway;
  let logger: ILoggerGateway;
  let configService: ConfigService;

  let mockClient: {
    isOpen: boolean;
    connect: jest.Mock;
    set: jest.Mock;
    expire: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
    scan: jest.Mock;
  };

  beforeEach(async() => {
    mockClient = {
      isOpen: false,
      connect: jest.fn().mockImplementation(async() => {
        mockClient.isOpen = true;
      }),
      set: jest.fn().mockResolvedValue(undefined),
      expire: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(undefined),
      scan: jest.fn().mockResolvedValue({ cursor: 0, keys: [] }),
    };

    jest.mocked(createClient).mockReturnValue(mockClient as any);

    logger = createMock<ILoggerGateway>();
    configService = createMock<ConfigService>({ redisUrl: REDIS_URL });

    const module = await Test.createTestingModule({
      providers: [
        CacheRedisAdapterGateway,
        { provide: TOKENS.LoggerGateway, useValue: logger },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    sut = module.get(CacheRedisAdapterGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('onModuleInit', () => {
    describe('Happy path', () => {
      it('should create the client with the configured url and connect', async() => {
        // Act
        await sut.onModuleInit();

        // Assert
        expect(createClient).toHaveBeenCalledTimes(1);
        expect(createClient).toHaveBeenCalledWith({ url: REDIS_URL });
        expect(mockClient.connect).toHaveBeenCalledTimes(1);
      });

      it('should reuse the open client instead of creating a new one on later operations', async() => {
        // Arrange
        await sut.onModuleInit();

        // Act
        await sut.get('key');
        await sut.delete('key');

        // Assert
        expect(createClient).toHaveBeenCalledTimes(1);
        expect(mockClient.connect).toHaveBeenCalledTimes(1);
      });
    });

    describe('Error path', () => {
      it('should log the connection failure without exposing the redis url', async() => {
        // Arrange
        const connectError = new Error('ECONNREFUSED');
        mockClient.connect.mockRejectedValue(connectError);

        // Act
        await sut.onModuleInit();

        // Assert
        expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'connect',
          key: 'connect',
          error: connectError,
        });
        expect(JSON.stringify(jest.mocked(logger.error).mock.calls)).not.toContain('secret');
      });

      it('should not throw when the connection fails', async() => {
        // Arrange
        mockClient.connect.mockRejectedValue(new Error('ECONNREFUSED'));

        // Act & Assert
        await expect(sut.onModuleInit()).resolves.toBeUndefined();
      });
    });

    describe('Edge cases', () => {
      it('should reconnect on the next operation when the initial connection failed', async() => {
        // Arrange
        mockClient.connect.mockRejectedValueOnce(new Error('ECONNREFUSED'));
        await sut.onModuleInit();

        // Act
        await sut.set('key', 'value');

        // Assert
        expect(mockClient.connect).toHaveBeenCalledTimes(2);
        expect(mockClient.set).toHaveBeenCalledWith('key', JSON.stringify('value'));
      });
    });
  });

  describe('set', () => {
    beforeEach(async() => {
      await sut.onModuleInit();
    });

    describe('Happy path', () => {
      it('should store the serialized value and expire it with the provided ttl', async() => {
        // Act
        await sut.set('key', { foo: 'bar' }, 30);

        // Assert
        expect(mockClient.set).toHaveBeenCalledWith('key', JSON.stringify({ foo: 'bar' }));
        expect(mockClient.expire).toHaveBeenCalledWith('key', 30);
      });

      it('should log debug without the cached value', async() => {
        // Act
        await sut.set('key', { foo: 'bar' }, 30);

        // Assert
        expect(logger.debug).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'set',
          key: 'key',
          ttlInSeconds: 30,
        });
      });

      it('should skip the debug log when skipLog is true', async() => {
        // Act
        await sut.set('key', 'value', 10, true);

        // Assert
        expect(logger.debug).not.toHaveBeenCalled();
        expect(mockClient.set).toHaveBeenCalledWith('key', JSON.stringify('value'));
      });
    });

    describe('Error path', () => {
      it('should log the error without the cached value and not throw when the client rejects', async() => {
        // Arrange
        const error = new Error('write failed');
        mockClient.set.mockRejectedValue(error);

        // Act & Assert
        await expect(sut.set('key', 'secret-token')).resolves.toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'set',
          key: 'key',
          ttlInSeconds: undefined,
          error,
        });
        expect(JSON.stringify(jest.mocked(logger.error).mock.calls)).not.toContain('secret-token');
      });

      it('should not throw when the connection is down', async() => {
        // Arrange
        mockClient.isOpen = false;
        mockClient.connect.mockRejectedValue(new Error('ECONNREFUSED'));

        // Act & Assert
        await expect(sut.set('key', 'value')).resolves.toBeUndefined();
        expect(mockClient.set).not.toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        0,
        -10,
      ])('should default the expiration to one day when ttlInSeconds is %s', async(ttlInSeconds: any) => {
        // Act
        await sut.set('key', 'value', ttlInSeconds);

        // Assert
        expect(mockClient.expire).toHaveBeenCalledWith('key', 86400);
      });

      it('should store null as a serialized value', async() => {
        // Act
        await sut.set('key', null);

        // Assert
        expect(mockClient.set).toHaveBeenCalledWith('key', 'null');
      });
    });
  });

  describe('get', () => {
    beforeEach(async() => {
      await sut.onModuleInit();
    });

    describe('Happy path', () => {
      it('should return the parsed value when the key exists', async() => {
        // Arrange
        mockClient.get.mockResolvedValue(JSON.stringify({ foo: 'bar' }));

        // Act
        const result = await sut.get('key');

        // Assert
        expect(mockClient.get).toHaveBeenCalledWith('key');
        expect(result).toEqual({ foo: 'bar' });
      });
    });

    describe('Error path', () => {
      it('should return null and log the error when the client rejects', async() => {
        // Arrange
        const error = new Error('read failed');
        mockClient.get.mockRejectedValue(error);

        // Act
        const result = await sut.get('key');

        // Assert
        expect(result).toBeNull();
        expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'get',
          key: 'key',
          error,
        });
      });

      it('should return null and log the error when the stored content is not valid json', async() => {
        // Arrange
        mockClient.get.mockResolvedValue('not-json');

        // Act
        const result = await sut.get('key');

        // Assert
        expect(result).toBeNull();
        expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, expect.objectContaining({
          adapter: 'redis',
          action: 'get',
          key: 'key',
        }));
      });
    });

    describe('Edge cases', () => {
      it.each([
        null,
        undefined,
        '',
      ])('should return null when the client returns %s', async(stored: any) => {
        // Arrange
        mockClient.get.mockResolvedValue(stored);

        // Act
        const result = await sut.get('missing');

        // Assert
        expect(result).toBeNull();
      });

      it('should return null without logging an error when the connection is down', async() => {
        // Arrange
        mockClient.isOpen = false;
        mockClient.connect.mockRejectedValue(new Error('ECONNREFUSED'));

        // Act
        const result = await sut.get('key');

        // Assert
        expect(result).toBeNull();
        expect(mockClient.get).not.toHaveBeenCalled();
      });
    });
  });

  describe('delete', () => {
    beforeEach(async() => {
      await sut.onModuleInit();
    });

    describe('Happy path', () => {
      it('should delete the key and log debug', async() => {
        // Act
        await sut.delete('key');

        // Assert
        expect(mockClient.del).toHaveBeenCalledWith('key');
        expect(logger.debug).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'delete',
          key: 'key',
        });
      });
    });

    describe('Error path', () => {
      it('should log the error and not throw when the client rejects', async() => {
        // Arrange
        const error = new Error('delete failed');
        mockClient.del.mockRejectedValue(error);

        // Act & Assert
        await expect(sut.delete('key')).resolves.toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'delete',
          key: 'key',
          error,
        });
      });
    });
  });

  describe('deleteContaining', () => {
    beforeEach(async() => {
      await sut.onModuleInit();
    });

    describe('Happy path', () => {
      it('should scan with the wildcard pattern and delete every matching key', async() => {
        // Arrange
        mockClient.scan.mockResolvedValue({ cursor: 0, keys: ['user:1:profile', 'user:2:profile'] });

        // Act
        await sut.deleteContaining('profile');

        // Assert
        expect(mockClient.scan).toHaveBeenCalledWith(0, { MATCH: '*profile*', COUNT: 100 });
        expect(mockClient.del).toHaveBeenCalledWith(['user:1:profile', 'user:2:profile']);
        expect(logger.debug).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'deleteContaining',
          key: ['user:1:profile', 'user:2:profile'],
        });
      });
    });

    describe('Error path', () => {
      it('should log the error and not throw when the scan rejects', async() => {
        // Arrange
        const error = new Error('scan failed');
        mockClient.scan.mockRejectedValue(error);

        // Act & Assert
        await expect(sut.deleteContaining('key')).resolves.toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'deleteContaining',
          key: 'key',
          error,
        });
      });

      it('should log the error and not throw when the batch delete rejects', async() => {
        // Arrange
        const error = new Error('delete failed');
        mockClient.scan.mockResolvedValue({ cursor: 0, keys: ['a'] });
        mockClient.del.mockRejectedValue(error);

        // Act & Assert
        await expect(sut.deleteContaining('a')).resolves.toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'deleteContaining',
          key: 'a',
          error,
        });
      });
    });

    describe('Edge cases', () => {
      it('should paginate until the cursor returns to zero', async() => {
        // Arrange
        mockClient.scan
          .mockResolvedValueOnce({ cursor: 5, keys: ['a'] })
          .mockResolvedValueOnce({ cursor: 0, keys: ['b'] });

        // Act
        await sut.deleteContaining('x');

        // Assert
        expect(mockClient.scan).toHaveBeenCalledTimes(2);
        expect(mockClient.del).toHaveBeenCalledWith(['a', 'b']);
      });

      it('should not call del nor log debug when no key matches', async() => {
        // Arrange
        mockClient.scan.mockResolvedValue({ cursor: 0, keys: [] });

        // Act
        await sut.deleteContaining('nothing');

        // Assert
        expect(mockClient.del).not.toHaveBeenCalled();
        expect(logger.debug).not.toHaveBeenCalled();
      });
    });
  });
});
