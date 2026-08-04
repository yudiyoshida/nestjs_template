import { createMock } from '@golevelup/ts-jest';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { FindAccountByCredential } from 'src/app/account/application/usecases/find-account-by-credential/find-account-by-credential.service';
import { AccountWithSensitiveDataDto } from 'src/app/account/application/dtos/account.dto';
import { RefreshTokenSession } from 'src/app/authentication/application/usecases/refresh-token-session/refresh-token-session.service';
import { Password } from 'src/shared/value-objects/password/password.vo';
import { ForbiddenAccountError } from '../../errors/forbidden-account.error';
import { InactiveAccountError } from '../../errors/inactive-account.error';
import { InvalidCredentialError } from '../../errors/invalid-credential.error';
import { SigninWithCredentialAndPasswordInputDto } from './dtos/signin-with-credential-and-password.dto';
import { SignInWithCredentialAndPassword } from './signin-with-credential-and-password.service';

function makeAccount(overrides: Partial<AccountWithSensitiveDataDto> = {}): AccountWithSensitiveDataDto {
  return {
    id: 'account-id',
    email: 'jhondoe@email.com',
    password: 'hashed-password',
    passwordResetToken: null,
    status: AccountStatus.ACTIVE,
    roles: [AccountRole.STUDENT],
    ...overrides,
  };
}

describe('SignInWithCredentialAndPassword - Unit tests', () => {
  let sut: SignInWithCredentialAndPassword;
  let jwtService: JwtService;
  let findAccountByCredential: FindAccountByCredential;
  let refreshTokenSession: RefreshTokenSession;

  beforeEach(async() => {
    jwtService = createMock<JwtService>();
    findAccountByCredential = createMock<FindAccountByCredential>();
    refreshTokenSession = createMock<RefreshTokenSession>();

    const module = await Test.createTestingModule({
      providers: [
        SignInWithCredentialAndPassword,
        { provide: JwtService, useValue: jwtService },
        { provide: FindAccountByCredential, useValue: findAccountByCredential },
        { provide: RefreshTokenSession, useValue: refreshTokenSession },
      ],
    }).compile();

    sut = module.get(SignInWithCredentialAndPassword);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should throw InvalidCredentialError when no account matches the credential', async() => {
    // Arrange
    jest.spyOn(findAccountByCredential, 'execute').mockResolvedValue(null);
    const data: SigninWithCredentialAndPasswordInputDto = { credential: 'missing@email.com', password: '123456' };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(InvalidCredentialError);
    });
  });

  it('should throw InvalidCredentialError when the password does not match', async() => {
    // Arrange
    const account = makeAccount();
    jest.spyOn(findAccountByCredential, 'execute').mockResolvedValue(account);
    jest.spyOn(Password, 'compare').mockReturnValue(false);
    const data: SigninWithCredentialAndPasswordInputDto = { credential: account.email, password: 'wrong-password' };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(InvalidCredentialError);
    });
  });

  it('should throw InactiveAccountError when the account is inactive', async() => {
    // Arrange
    const account = makeAccount({ status: AccountStatus.INACTIVE });
    jest.spyOn(findAccountByCredential, 'execute').mockResolvedValue(account);
    jest.spyOn(Password, 'compare').mockReturnValue(true);
    const data: SigninWithCredentialAndPasswordInputDto = { credential: account.email, password: '123456' };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(InactiveAccountError);
    });
  });

  it('should throw ForbiddenAccountError when the account is pending', async() => {
    // Arrange
    const account = makeAccount({ status: AccountStatus.PENDING });
    jest.spyOn(findAccountByCredential, 'execute').mockResolvedValue(account);
    jest.spyOn(Password, 'compare').mockReturnValue(true);
    const data: SigninWithCredentialAndPasswordInputDto = { credential: account.email, password: '123456' };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(ForbiddenAccountError);
    });
  });

  it('should return an access/refresh token pair for a valid active account', async() => {
    // Arrange
    const account = makeAccount();
    jest.spyOn(findAccountByCredential, 'execute').mockResolvedValue(account);
    jest.spyOn(Password, 'compare').mockReturnValue(true);
    jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');
    jest.spyOn(refreshTokenSession, 'issue').mockResolvedValue('new-refresh-token');
    const data: SigninWithCredentialAndPasswordInputDto = { credential: account.email, password: '123456' };

    // Act
    const result = await sut.execute(data);

    // Assert
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: account.id, roles: account.roles });
    expect(refreshTokenSession.issue).toHaveBeenCalledWith({ sub: account.id, roles: account.roles });
    expect(result).toEqual({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' });
  });
});
