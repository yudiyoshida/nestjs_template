import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { CacheKeyBuilder } from 'src/infra/cache/helpers/cache-key/cache-key.builder';

@Injectable()
export class RevokeRefreshTokenSession {
  constructor(
    @Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway,
  ) {}

  public async execute(accountId: string): Promise<void> {
    await this.cacheGateway.delete(
      new CacheKeyBuilder().setResource('refresh-token').setCommand('detail', accountId).build(),
    );
  }
}
