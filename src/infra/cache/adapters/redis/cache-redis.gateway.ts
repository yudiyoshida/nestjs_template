import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { type ILoggerGateway, LogContext } from 'src/infra/logger/logger.gateway';
import { ICacheGateway } from '../../cache.gateway';

@Injectable()
export class CacheRedisAdapterGateway implements ICacheGateway, OnModuleInit {
  private readonly ONE_DAY_IN_SECONDS = 86400;
  private client: RedisClientType | null = null;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly configService: ConfigService,
  ) {}

  public async onModuleInit(): Promise<void> {
    await this.connectToRedis();
  }

  public async set<T>(key: string, value: T, ttlInSeconds?: number, skipLog: boolean = false): Promise<void> {
    try {
      const client = await this.getClient();
      await client?.set(key, this.toVendor(value));
      await client?.expire(
        key,
        ttlInSeconds && ttlInSeconds > 0 ? ttlInSeconds : this.ONE_DAY_IN_SECONDS,
      );
      if (skipLog) {
        return;
      }
      this.logger.debug(LogContext.CACHE, {
        adapter: 'redis',
        action: 'set',
        key,
        ttlInSeconds,
      });
    }
    catch (error) {
      this.logger.error(LogContext.CACHE, {
        adapter: 'redis',
        action: 'set',
        key,
        ttlInSeconds,
        error,
      });
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient();
      const value = await client?.get(key);
      return this.toPort<T>(value);
    }
    catch (error) {
      this.logger.error(LogContext.CACHE, {
        adapter: 'redis',
        action: 'get',
        key,
        error,
      });
      return null;
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client?.del(key);
      this.logger.debug(LogContext.CACHE, {
        adapter: 'redis',
        action: 'delete',
        key,
      });
    }
    catch (error) {
      this.logger.error(LogContext.CACHE, {
        adapter: 'redis',
        action: 'delete',
        key,
        error,
      });
    }
  }

  public async deleteContaining(key: string): Promise<void> {
    try {
      const client = await this.getClient();
      const keys: string[] = [];
      let cursor = 0;

      do {
        const result = await client?.scan(cursor, { MATCH: `*${key}*`, COUNT: 100 });
        if (result) {
          cursor = result.cursor;
          keys.push(...result.keys);
        }
      } while (cursor !== 0);

      if (keys.length > 0) {
        await client?.del(keys);
        this.logger.debug(LogContext.CACHE, {
          adapter: 'redis',
          action: 'deleteContaining',
          key: keys,
        });
      }
    }
    catch (error) {
      this.logger.error(LogContext.CACHE, {
        adapter: 'redis',
        action: 'deleteContaining',
        key,
        error,
      });
    }
  }

  private async connectToRedis(): Promise<void> {
    if (this.client?.isOpen) {
      return;
    }

    try {
      this.client = createClient({
        url: this.configService.redisUrl,
      });
      await this.client.connect();
    }
    catch (error) {
      this.logger.error(LogContext.CACHE, {
        adapter: 'redis',
        action: 'connect',
        key: 'connect',
        error,
      });
      this.client = null;
    }
  }

  private async getClient(): Promise<RedisClientType | null> {
    if (!this.client?.isOpen) {
      await this.connectToRedis();
    }

    return this.client;
  }

  private toVendor<T>(value: T): string {
    return JSON.stringify(value);
  }

  private toPort<T>(raw: string | null | undefined): T | null {
    return raw ? JSON.parse(raw) as T : null;
  }
}
