import { createMock } from '@golevelup/ts-jest';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { RefreshTokenSession } from 'src/app/authentication/application/services/refresh-token-session/refresh-token-session.service';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { Logout } from './logout.service';

describe('Logout - Unit tests', () => {
  let sut: Logout;
  let cacheGateway: ICacheGateway;

  beforeEach(async() => {
    cacheGateway = createMock<ICacheGateway>();

    const module = await Test.createTestingModule({
      providers: [
        Logout,
        RefreshTokenSession,
        { provide: TOKENS.CacheGateway, useValue: cacheGateway },
        { provide: JwtService, useValue: createMock<JwtService>() },
        { provide: ConfigService, useValue: createMock<ConfigService>() },
      ],
    }).compile();

    sut = module.get(Logout);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should delete the cached refresh token for the account', async() => {
    // Arrange
    const accountId = '123';
    const deleteSpy = jest.spyOn(cacheGateway, 'delete');

    // Act
    const result = await sut.execute(accountId);

    // Assert
    expect(deleteSpy).toHaveBeenCalledWith(`cache:global:refresh-token:detail:${accountId}`);
    expect(result).toEqual({ message: 'Sessão encerrada com sucesso.' });
  });
});
