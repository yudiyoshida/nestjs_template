import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { CacheKeyBuilder } from 'src/infra/cache/helpers/cache-key/cache-key.builder';
import { InvalidRefreshTokenError } from '../../errors/invalid-refresh-token.error';

@Injectable()
export class RefreshTokenSession {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway,
  ) {}

  public async issue(payload: Payload): Promise<string> {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.refreshTokenSecret,
      expiresIn: this.configService.refreshTokenExpiresIn,
      jwtid: randomUUID(),
    });

    await this.cacheGateway.set(
      this.buildCacheKey(payload.sub),
      this.hash(refreshToken),
      this.configService.refreshTokenExpiresIn,
    );

    return refreshToken;
  }

  public async validate(refreshToken: string): Promise<Payload> {
    const payload = await this.verify(refreshToken);

    const cachedHash = await this.cacheGateway.get<string>(this.buildCacheKey(payload.sub));
    if (!cachedHash || cachedHash !== this.hash(refreshToken)) {
      throw new InvalidRefreshTokenError();
    }

    return payload;
  }

  public async revoke(accountId: string): Promise<void> {
    await this.cacheGateway.delete(this.buildCacheKey(accountId));
  }

  private async verify(refreshToken: string): Promise<Payload> {
    try {
      return await this.jwtService.verifyAsync<Payload>(refreshToken, {
        secret: this.configService.refreshTokenSecret,
      });
    }
    catch {
      throw new InvalidRefreshTokenError();
    }
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildCacheKey(accountId: string): string {
    return new CacheKeyBuilder()
      .setResource('refresh-token')
      .setCommand('detail', accountId)
      .build();
  }
}
