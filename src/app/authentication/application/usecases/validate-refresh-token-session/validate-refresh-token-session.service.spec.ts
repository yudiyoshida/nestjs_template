import { createMock } from '@golevelup/ts-jest';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { createHash } from 'crypto';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { InvalidRefreshTokenError } from 'src/app/authentication/application/errors/invalid-refresh-token.error';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { ValidateRefreshTokenSession } from './validate-refresh-token-session.service';

describe('ValidateRefreshTokenSession - Unit tests', () => {
  let sut: ValidateRefreshTokenSession;
  let jwtService: JwtService;
  let cacheGateway: ICacheGateway;

  const refreshSecret = 'refresh-secret';
  const accountId = 'account-123';
  const payload: Payload = { sub: accountId, roles: [AccountRole.STUDENT] };
  const cacheKey = `cache:global:refresh-token:detail:${accountId}`;

  function hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  beforeEach(async() => {
    cacheGateway = createMock<ICacheGateway>();
    jwtService = createMock<JwtService>();

    const configService = createMock<ConfigService>({
      refreshTokenSecret: refreshSecret,
    });

    const module = await Test.createTestingModule({
      providers: [
        ValidateRefreshTokenSession,
        { provide: TOKENS.CacheGateway, useValue: cacheGateway },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    sut = module.get(ValidateRefreshTokenSession);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should return the payload when the token and cached hash match', async() => {
    // Arrange
    const refreshToken = 'valid.refresh.token';
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
    jest.spyOn(cacheGateway, 'get').mockResolvedValue(hash(refreshToken));

    // Act
    const result = await sut.execute(refreshToken);

    // Assert
    expect(result).toEqual(payload);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshToken, { secret: refreshSecret });
    expect(cacheGateway.get).toHaveBeenCalledWith(cacheKey);
  });

  it('should throw InvalidRefreshTokenError when JWT verification fails', async() => {
    // Arrange
    jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('invalid'));

    // Act & Assert
    await expect(sut.execute('bad-token')).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('should throw InvalidRefreshTokenError when there is no cached hash', async() => {
    // Arrange
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
    jest.spyOn(cacheGateway, 'get').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute('valid.refresh.token')).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('should throw InvalidRefreshTokenError when the cached hash does not match', async() => {
    // Arrange
    const refreshToken = 'valid.refresh.token';
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
    jest.spyOn(cacheGateway, 'get').mockResolvedValue(hash('other-token'));

    // Act & Assert
    await expect(sut.execute(refreshToken)).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });
});
