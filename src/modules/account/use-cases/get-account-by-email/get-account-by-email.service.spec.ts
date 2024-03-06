import { TestBed } from '@automock/jest';

import { TOKENS } from 'src/shared/di/tokens';
import { Account } from '../../entities/account.entity';
import { AccountInMemoryAdapterRepository } from '../../repositories/adapters/account-in-memory.repository';
import { GetAccountByEmailService } from './get-account-by-email.service';

const account: Account = {
  id: 'random-id',
  name: 'Jhon Doe',
  email: 'jhondoe@email.com',
  password: '123abc456',
  permissions: [],
};

describe('GetAccountByEmailService', () => {
  let service: GetAccountByEmailService;
  let mockRepository: jest.Mocked<AccountInMemoryAdapterRepository>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(GetAccountByEmailService).compile();

    service = unit;
    mockRepository = unitRef.get(TOKENS.IAccountRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call the repository with correct arguments', async() => {
    await service.execute(account.email);

    expect(mockRepository.findByEmail).toHaveBeenCalledExactlyOnceWith(account.email);
  });

  it('should return the result without removing or adding any field', async() => {
    mockRepository.findByEmail.mockResolvedValue(account);

    const result = await service.execute(account.email);

    expect(result).toEqual(account);
  });
});
