import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { InvalidRefreshTokenError } from 'src/app/authentication/application/errors/invalid-refresh-token.error';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { CacheKeyBuilder } from 'src/infra/cache/helpers/cache-key/cache-key.builder';

@Injectable()
export class ValidateRefreshTokenSession {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway,
  ) {}

  public async execute(refreshToken: string): Promise<Payload> {
    const payload = await this.verify(refreshToken);

    const cachedHash = await this.cacheGateway.get<string>(
      new CacheKeyBuilder().setResource('refresh-token').setCommand('detail', payload.sub).build(),
    );
    if (!cachedHash || cachedHash !== this.hash(refreshToken)) {
      throw new InvalidRefreshTokenError();
    }

    return payload;
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
}
