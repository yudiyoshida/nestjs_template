import { createMock } from '@golevelup/ts-jest';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { AccountDto } from 'src/app/account/application/dtos/account.dto';
import { FindAccountById } from 'src/app/account/application/usecases/find-account-by-id/find-account-by-id.service';
import { IssueRefreshTokenSession } from 'src/app/authentication/application/usecases/issue-refresh-token-session/issue-refresh-token-session.service';
import { ValidateRefreshTokenSession } from 'src/app/authentication/application/usecases/validate-refresh-token-session/validate-refresh-token-session.service';
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
  let validateRefreshTokenSession: ValidateRefreshTokenSession;
  let issueRefreshTokenSession: IssueRefreshTokenSession;

  beforeEach(async() => {
    jwtService = createMock<JwtService>();
    findAccountById = createMock<FindAccountById>();
    validateRefreshTokenSession = createMock<ValidateRefreshTokenSession>();
    issueRefreshTokenSession = createMock<IssueRefreshTokenSession>();

    const module = await Test.createTestingModule({
      providers: [
        RefreshToken,
        { provide: JwtService, useValue: jwtService },
        { provide: FindAccountById, useValue: findAccountById },
        { provide: ValidateRefreshTokenSession, useValue: validateRefreshTokenSession },
        { provide: IssueRefreshTokenSession, useValue: issueRefreshTokenSession },
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
    jest.spyOn(validateRefreshTokenSession, 'execute').mockResolvedValue(payload);
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
    jest.spyOn(validateRefreshTokenSession, 'execute').mockResolvedValue({ sub: account.id, roles: account.roles });
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
    jest.spyOn(validateRefreshTokenSession, 'execute').mockResolvedValue({ sub: account.id, roles: account.roles });
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
    jest.spyOn(validateRefreshTokenSession, 'execute').mockResolvedValue({ sub: account.id, roles: account.roles });
    jest.spyOn(findAccountById, 'execute').mockResolvedValue(account);
    jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');
    jest.spyOn(issueRefreshTokenSession, 'execute').mockResolvedValue('new-refresh-token');
    const data: RefreshTokenInputDto = { refreshToken: 'some-refresh-token' };

    // Act
    const result = await sut.execute(data);

    // Assert
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: account.id, roles: account.roles });
    expect(issueRefreshTokenSession.execute).toHaveBeenCalledWith({ sub: account.id, roles: account.roles });
    expect(result).toEqual({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' });
  });
});
