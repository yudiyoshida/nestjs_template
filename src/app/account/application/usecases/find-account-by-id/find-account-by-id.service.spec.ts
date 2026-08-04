import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { TOKENS } from 'src/core/di/token';
import { AccountDto } from '../../dtos/account.dto';
import type { IAccountDao } from '../../persistence/dao/account-dao.interface';
import { FindAccountById } from './find-account-by-id.service';

function makeAccount(overrides: Partial<AccountDto> = {}): AccountDto {
  return {
    id: 'account-id',
    email: 'jhondoe@email.com',
    status: AccountStatus.ACTIVE,
    roles: [],
    ...overrides,
  };
}

describe('FindAccountById - Unit tests', () => {
  let sut: FindAccountById;
  let accountDao: IAccountDao;

  beforeEach(async() => {
    accountDao = createMock<IAccountDao>();

    const module = await Test.createTestingModule({
      providers: [
        FindAccountById,
        { provide: TOKENS.AccountDao, useValue: accountDao },
      ],
    }).compile();

    sut = module.get(FindAccountById);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should return the account when found', async() => {
    // Arrange
    const account = makeAccount();
    jest.spyOn(accountDao, 'findById').mockResolvedValue(account);

    // Act
    const result = await sut.execute(account.id);

    // Assert
    expect(accountDao.findById).toHaveBeenCalledWith(account.id);
    expect(result).toEqual(account);
  });

  it('should return null when no account matches the id', async() => {
    // Arrange
    jest.spyOn(accountDao, 'findById').mockResolvedValue(null);

    // Act
    const result = await sut.execute('missing-id');

    // Assert
    expect(result).toBeNull();
  });
});
