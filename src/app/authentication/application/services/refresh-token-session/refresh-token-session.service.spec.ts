import { createMock } from '@golevelup/ts-jest';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { createHash } from 'crypto';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { InvalidRefreshTokenError } from '../../errors/invalid-refresh-token.error';
import { RefreshTokenSession } from './refresh-token-session.service';

describe('RefreshTokenSession - Unit tests', () => {
  let sut: RefreshTokenSession;
  let jwtService: JwtService;
  let cacheGateway: ICacheGateway;

  const refreshSecret = 'refresh-secret';
  const refreshExpiresIn = 604_800;
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
      refreshTokenExpiresIn: refreshExpiresIn,
    });

    const module = await Test.createTestingModule({
      providers: [
        RefreshTokenSession,
        { provide: TOKENS.CacheGateway, useValue: cacheGateway },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    sut = module.get(RefreshTokenSession);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  describe('issue', () => {
    it('should sign a refresh token and store its hash in cache', async() => {
      // Arrange
      const signedToken = 'signed.refresh.token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(signedToken);
      const setSpy = jest.spyOn(cacheGateway, 'set').mockResolvedValue();

      // Act
      const result = await sut.issue(payload);

      // Assert
      expect(result).toBe(signedToken);
      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
        jwtid: expect.any(String),
      });
      expect(setSpy).toHaveBeenCalledWith(cacheKey, hash(signedToken), refreshExpiresIn);
    });
  });

  describe('validate', () => {
    it('should return the payload when the token and cached hash match', async() => {
      // Arrange
      const refreshToken = 'valid.refresh.token';
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(cacheGateway, 'get').mockResolvedValue(hash(refreshToken));

      // Act
      const result = await sut.validate(refreshToken);

      // Assert
      expect(result).toEqual(payload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshToken, { secret: refreshSecret });
      expect(cacheGateway.get).toHaveBeenCalledWith(cacheKey);
    });

    it('should throw InvalidRefreshTokenError when JWT verification fails', async() => {
      // Arrange
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('invalid'));

      // Act & Assert
      await expect(sut.validate('bad-token')).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    });

    it('should throw InvalidRefreshTokenError when there is no cached hash', async() => {
      // Arrange
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(cacheGateway, 'get').mockResolvedValue(null);

      // Act & Assert
      await expect(sut.validate('valid.refresh.token')).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    });

    it('should throw InvalidRefreshTokenError when the cached hash does not match', async() => {
      // Arrange
      const refreshToken = 'valid.refresh.token';
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(cacheGateway, 'get').mockResolvedValue(hash('other-token'));

      // Act & Assert
      await expect(sut.validate(refreshToken)).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    });
  });

  describe('revoke', () => {
    it('should delete the cached refresh token for the account', async() => {
      // Arrange
      const deleteSpy = jest.spyOn(cacheGateway, 'delete').mockResolvedValue();

      // Act
      await sut.revoke(accountId);

      // Assert
      expect(deleteSpy).toHaveBeenCalledWith(cacheKey);
    });
  });
});
