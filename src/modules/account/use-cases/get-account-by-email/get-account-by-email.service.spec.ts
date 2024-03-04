import { TestBed } from '@automock/jest';

import { TOKENS } from 'src/shared/di/tokens';
import { AccountInMemoryAdapterRepository } from '../../repositories/adapters/account-in-memory.repository';
import { GetAccountByEmailService } from './get-account-by-email.service';

describe('GetAccountByEmailService', () => {
  let service: GetAccountByEmailService;
  let mockRepository: jest.Mocked<AccountInMemoryAdapterRepository>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(GetAccountByEmailService).compile();

    service = unit;
    mockRepository = unitRef.get(TOKENS.IAccountRepository);
  });

  it('should call the repository with correct arguments', async() => {
    const email = 'jhondoe@email.com';

    await service.execute(email);

    expect(mockRepository.findByEmail).toHaveBeenCalledExactlyOnceWith(email);
  });
});
