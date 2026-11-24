import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { RevokeRefreshTokenSession } from './revoke-refresh-token-session.service';

describe('RevokeRefreshTokenSession - Unit tests', () => {
  let sut: RevokeRefreshTokenSession;
  let cacheGateway: ICacheGateway;

  beforeEach(async() => {
    cacheGateway = createMock<ICacheGateway>();

    const module = await Test.createTestingModule({
      providers: [
        RevokeRefreshTokenSession,
        { provide: TOKENS.CacheGateway, useValue: cacheGateway },
      ],
    }).compile();

    sut = module.get(RevokeRefreshTokenSession);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should delete the cached refresh token for the account', async() => {
    // Arrange
    const accountId = 'account-123';
    const deleteSpy = jest.spyOn(cacheGateway, 'delete').mockResolvedValue();

    // Act
    await sut.execute(accountId);

    // Assert
    expect(deleteSpy).toHaveBeenCalledWith(`cache:global:refresh-token:detail:${accountId}`);
  });
});
