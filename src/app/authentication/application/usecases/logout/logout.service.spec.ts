import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { RevokeRefreshTokenSession } from 'src/app/authentication/application/usecases/revoke-refresh-token-session/revoke-refresh-token-session.service';
import { Logout } from './logout.service';

describe('Logout - Unit tests', () => {
  let sut: Logout;
  let revokeRefreshTokenSession: RevokeRefreshTokenSession;

  beforeEach(async() => {
    revokeRefreshTokenSession = createMock<RevokeRefreshTokenSession>();

    const module = await Test.createTestingModule({
      providers: [
        Logout,
        { provide: RevokeRefreshTokenSession, useValue: revokeRefreshTokenSession },
      ],
    }).compile();

    sut = module.get(Logout);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should revoke the refresh token session of the account', async() => {
    // Arrange
    const accountId = '123';
    const revokeSpy = jest.spyOn(revokeRefreshTokenSession, 'execute').mockResolvedValue();

    // Act
    await sut.execute(accountId);

    // Assert
    expect(revokeSpy).toHaveBeenCalledWith(accountId);
  });

  it('should return a success message', async() => {
    // Arrange
    const accountId = '123';
    jest.spyOn(revokeRefreshTokenSession, 'execute').mockResolvedValue();

    // Act
    const result = await sut.execute(accountId);

    // Assert
    expect(result).toEqual({ message: 'Sessão encerrada com sucesso.' });
  });
});
