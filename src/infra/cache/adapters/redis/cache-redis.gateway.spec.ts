import { createClient } from 'redis';
import { ConfigService } from 'src/core/config/config.service';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { CacheRedisAdapterGateway } from './cache-redis.gateway';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('CacheRedisAdapterGateway - Unit tests', () => {
  let sut: CacheRedisAdapterGateway;
  let logger: jest.Mocked<ILoggerGateway>;
  let configService: jest.Mocked<Pick<ConfigService, 'redisUrl'>>;

  let mockClient: {
    isOpen: boolean;
    connect: jest.Mock;
    set: jest.Mock;
    expire: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
    scan: jest.Mock;
  };

  const buildSut = async() => {
    const gateway = new CacheRedisAdapterGateway(logger, configService as unknown as ConfigService);
    // constructor kicks off connectToRedis() without awaiting it
    await Promise.resolve();
    await Promise.resolve();
    return gateway;
  };

  beforeEach(() => {
    mockClient = {
      isOpen: false,
      connect: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      expire: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(undefined),
      scan: jest.fn().mockResolvedValue({ cursor: 0, keys: [] }),
    };

    jest.mocked(createClient).mockReturnValue(mockClient as any);

    logger = { debug: jest.fn(), error: jest.fn() };
    configService = { redisUrl: 'redis://localhost:6379' };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connection failure', () => {
    it('should log and keep client null when connect rejects', async() => {
      // Arrange
      const connectError = new Error('ECONNREFUSED');
      mockClient.connect.mockRejectedValue(connectError);

      // Act
      sut = await buildSut();
      await sut.set('key', 'value');

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
        adapter: 'redis',
        action: 'connect',
        key: configService.redisUrl,
        error: connectError,
      });
      expect(mockClient.set).not.toHaveBeenCalled();
    });
  });

  describe('when connected', () => {
    beforeEach(async() => {
      sut = await buildSut();
    });

    describe('set', () => {
      it('should set the value and expire with provided ttl, then log debug', async() => {
        // Act
        await sut.set('key', { foo: 'bar' }, 30);

        // Assert
        expect(mockClient.set).toHaveBeenCalledWith('key', JSON.stringify({ foo: 'bar' }));
        expect(mockClient.expire).toHaveBeenCalledWith('key', 30);
        expect(logger.debug).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'set',
          key: 'key',
          value: { foo: 'bar' },
          ttlInSeconds: 30,
        });
      });

      it('should default expire to one day when ttlInSeconds is not provided', async() => {
        // Act
        await sut.set('key', 'value');

        // Assert
        expect(mockClient.expire).toHaveBeenCalledWith('key', 86400);
      });

      it('should default expire to one day when ttlInSeconds is zero or negative', async() => {
        // Act
        await sut.set('key', 'value', 0);

        // Assert
        expect(mockClient.expire).toHaveBeenCalledWith('key', 86400);
      });

      it('should skip debug log when skipLog is true', async() => {
        // Act
        await sut.set('key', 'value', 10, true);

        // Assert
        expect(logger.debug).not.toHaveBeenCalled();
      });

      it('should log error and not throw when set fails', async() => {
        // Arrange
        const error = new Error('write failed');
        mockClient.set.mockRejectedValue(error);

        // Act & Assert
        await expect(sut.set('key', 'value')).resolves.toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'set',
          key: 'key',
          value: 'value',
          ttlInSeconds: undefined,
          error,
        });
      });
    });

    describe('get', () => {
      it('should return the parsed value when key exists', async() => {
        // Arrange
        mockClient.get.mockResolvedValue(JSON.stringify({ foo: 'bar' }));

        // Act
        const result = await sut.get('key');

        // Assert
        expect(result).toEqual({ foo: 'bar' });
      });

      it('should return null when key does not exist', async() => {
        // Arrange
        mockClient.get.mockResolvedValue(null);

        // Act
        const result = await sut.get('missing');

        // Assert
        expect(result).toBeNull();
      });

      it('should return null and log error when get fails', async() => {
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
    });

    describe('delete', () => {
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

      it('should log error and not throw when delete fails', async() => {
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

    describe('deleteContaining', () => {
      it('should scan and delete all matching keys', async() => {
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

      it('should paginate through multiple scan cursors', async() => {
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

      it('should not call del when no keys match', async() => {
        // Arrange
        mockClient.scan.mockResolvedValue({ cursor: 0, keys: [] });

        // Act
        await sut.deleteContaining('nothing');

        // Assert
        expect(mockClient.del).not.toHaveBeenCalled();
      });

      it('should log error and not throw when scan fails', async() => {
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
    });
  });
});
