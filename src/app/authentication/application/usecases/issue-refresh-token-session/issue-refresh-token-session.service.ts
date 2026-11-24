import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { CacheKeyBuilder } from 'src/infra/cache/helpers/cache-key/cache-key.builder';

@Injectable()
export class IssueRefreshTokenSession {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway,
  ) {}

  public async execute(payload: Payload): Promise<string> {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.refreshTokenSecret,
      expiresIn: this.configService.refreshTokenExpiresIn,
      jwtid: randomUUID(),
    });

    await this.cacheGateway.set(
      new CacheKeyBuilder().setResource('refresh-token').setCommand('detail', payload.sub).build(),
      this.hash(refreshToken),
      this.configService.refreshTokenExpiresIn,
    );

    return refreshToken;
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
