import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { TOKENS } from 'src/core/di/token';
import { AccountWithSensitiveDataDto } from '../../dtos/account.dto';
import type { IAccountDao } from '../../persistence/dao/account-dao.interface';
import { FindAccountByCredential } from './find-account-by-credential.service';

function makeAccount(overrides: Partial<AccountWithSensitiveDataDto> = {}): AccountWithSensitiveDataDto {
  return {
    id: 'account-id',
    email: 'jhondoe@email.com',
    password: 'hashed-password',
    passwordResetToken: null,
    status: AccountStatus.ACTIVE,
    roles: [],
    ...overrides,
  };
}

describe('FindAccountByCredential - Unit tests', () => {
  let sut: FindAccountByCredential;
  let accountDao: IAccountDao;

  beforeEach(async() => {
    accountDao = createMock<IAccountDao>();

    const module = await Test.createTestingModule({
      providers: [
        FindAccountByCredential,
        { provide: TOKENS.AccountDao, useValue: accountDao },
      ],
    }).compile();

    sut = module.get(FindAccountByCredential);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should return the account with sensitive data when found', async() => {
    // Arrange
    const account = makeAccount();
    jest.spyOn(accountDao, 'findByCredential').mockResolvedValue(account);

    // Act
    const result = await sut.execute(account.email);

    // Assert
    expect(accountDao.findByCredential).toHaveBeenCalledWith(account.email);
    expect(result).toEqual(account);
  });

  it('should return null when no account matches the credential', async() => {
    // Arrange
    jest.spyOn(accountDao, 'findByCredential').mockResolvedValue(null);

    // Act
    const result = await sut.execute('missing@email.com');

    // Assert
    expect(result).toBeNull();
  });
});
