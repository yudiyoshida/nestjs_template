import { createMock } from '@golevelup/ts-jest';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { AccountDto } from 'src/app/account/application/dtos/account.dto';
import { FindAccountById } from 'src/app/account/application/usecases/find-account-by-id/find-account-by-id.service';
import { RefreshTokenSession } from 'src/app/authentication/application/usecases/refresh-token-session/refresh-token-session.service';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ForbiddenAccountError } from '../../errors/forbidden-account.error';
import { InactiveAccountError } from '../../errors/inactive-account.error';
import { InvalidRefreshTokenError } from '../../errors/invalid-refresh-token.error';
import { RefreshTokenInputDto } from './dtos/refresh-token.dto';
import { RefreshToken } from './refresh-token.service';

function makeAccount(overrides: Partial<AccountDto> = {}): AccountDto {
  return {
    id: 'account-id',
    email: 'jhondoe@email.com',
    status: AccountStatus.ACTIVE,
    roles: [AccountRole.STUDENT],
    ...overrides,
  };
}

describe('RefreshToken - Unit tests', () => {
  let sut: RefreshToken;
  let jwtService: JwtService;
  let findAccountById: FindAccountById;
  let refreshTokenSession: RefreshTokenSession;

  beforeEach(async() => {
    jwtService = createMock<JwtService>();
    findAccountById = createMock<FindAccountById>();
    refreshTokenSession = createMock<RefreshTokenSession>();

    const module = await Test.createTestingModule({
      providers: [
        RefreshToken,
        { provide: JwtService, useValue: jwtService },
        { provide: FindAccountById, useValue: findAccountById },
        { provide: RefreshTokenSession, useValue: refreshTokenSession },
      ],
    }).compile();

    sut = module.get(RefreshToken);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should throw InvalidRefreshTokenError when the account no longer exists', async() => {
    // Arrange
    const payload: Payload = { sub: 'ghost-id', roles: [AccountRole.STUDENT] };
    jest.spyOn(refreshTokenSession, 'validate').mockResolvedValue(payload);
    jest.spyOn(findAccountById, 'execute').mockResolvedValue(null);
    const data: RefreshTokenInputDto = { refreshToken: 'some-refresh-token' };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(InvalidRefreshTokenError);
    });
  });

  it('should throw InactiveAccountError when the account is inactive', async() => {
    // Arrange
    const account = makeAccount({ status: AccountStatus.INACTIVE });
    jest.spyOn(refreshTokenSession, 'validate').mockResolvedValue({ sub: account.id, roles: account.roles });
    jest.spyOn(findAccountById, 'execute').mockResolvedValue(account);
    const data: RefreshTokenInputDto = { refreshToken: 'some-refresh-token' };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(InactiveAccountError);
    });
  });

  it('should throw ForbiddenAccountError when the account is pending', async() => {
    // Arrange
    const account = makeAccount({ status: AccountStatus.PENDING });
    jest.spyOn(refreshTokenSession, 'validate').mockResolvedValue({ sub: account.id, roles: account.roles });
    jest.spyOn(findAccountById, 'execute').mockResolvedValue(account);
    const data: RefreshTokenInputDto = { refreshToken: 'some-refresh-token' };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(ForbiddenAccountError);
    });
  });

  it('should return a new access/refresh token pair for an active account', async() => {
    // Arrange
    const account = makeAccount();
    jest.spyOn(refreshTokenSession, 'validate').mockResolvedValue({ sub: account.id, roles: account.roles });
    jest.spyOn(findAccountById, 'execute').mockResolvedValue(account);
    jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');
    jest.spyOn(refreshTokenSession, 'issue').mockResolvedValue('new-refresh-token');
    const data: RefreshTokenInputDto = { refreshToken: 'some-refresh-token' };

    // Act
    const result = await sut.execute(data);

    // Assert
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: account.id, roles: account.roles });
    expect(refreshTokenSession.issue).toHaveBeenCalledWith({ sub: account.id, roles: account.roles });
    expect(result).toEqual({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' });
  });
});
