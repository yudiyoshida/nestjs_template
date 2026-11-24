import { createMock } from '@golevelup/ts-jest';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { createHash } from 'crypto';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { IssueRefreshTokenSession } from './issue-refresh-token-session.service';

describe('IssueRefreshTokenSession - Unit tests', () => {
  let sut: IssueRefreshTokenSession;
  let jwtService: JwtService;
  let cacheGateway: ICacheGateway;

  const refreshSecret = 'refresh-secret';
  const refreshExpiresIn = 604_800;
  const accountId = 'account-123';
  const payload: Payload = { sub: accountId, roles: [AccountRole.STUDENT] };

  function hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  beforeEach(async() => {
    cacheGateway = createMock<ICacheGateway>();
    jwtService = createMock<JwtService>();

    const configService = createMock<ConfigService>({
      refreshTokenSecret: refreshSecret,
      refreshTokenExpiresIn: refreshExpiresIn,
    });

    const module = await Test.createTestingModule({
      providers: [
        IssueRefreshTokenSession,
        { provide: TOKENS.CacheGateway, useValue: cacheGateway },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    sut = module.get(IssueRefreshTokenSession);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should sign a refresh token and store its hash in cache', async() => {
    // Arrange
    const signedToken = 'signed.refresh.token';
    jest.spyOn(jwtService, 'sign').mockReturnValue(signedToken);
    const setSpy = jest.spyOn(cacheGateway, 'set').mockResolvedValue();

    // Act
    const result = await sut.execute(payload);

    // Assert
    expect(result).toBe(signedToken);
    expect(jwtService.sign).toHaveBeenCalledWith(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
      jwtid: expect.any(String),
    });
    expect(setSpy).toHaveBeenCalledWith(
      `cache:global:refresh-token:detail:${accountId}`,
      hash(signedToken),
      refreshExpiresIn,
    );
  });
});
