import { TestBed } from '@automock/jest';
import { NotFoundException } from '@nestjs/common';
import { TOKENS } from 'src/shared/ioc/tokens';
import { Account } from '../../entities/account.entity';
import { AccountInMemoryAdapterRepository } from '../../repositories/adapters/account-in-memory.repository';
import { GetAccountByIdService } from './get-account-by-id.service';

const account: Account = {
  id: 'random-id',
  name: 'Jhon Doe',
  email: 'jhondoe@email.com',
  password: '123abc456',
  status: 'pendente',
  permissions: [],
};

describe('GetAccountByIdService', () => {
  let service: GetAccountByIdService;
  let mockRepository: jest.Mocked<AccountInMemoryAdapterRepository>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(GetAccountByIdService).compile();

    service = unit;
    mockRepository = unitRef.get(TOKENS.IAccountRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call the repository with correct arguments', async() => {
    mockRepository.findById.mockResolvedValue({} as Account);

    await service.execute('id');

    expect(mockRepository.findById).toHaveBeenCalledExactlyOnceWith('id');
  });

  it('should find a specific account', async() => {
    mockRepository.findById.mockResolvedValue({} as Account);

    const result = await service.execute('id');

    expect(result).toEqual({});
  });

  it('should not return the account password', async() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...expectedResult } = account;
    mockRepository.findById.mockResolvedValue(account);

    const result = await service.execute('id');

    expect(result).toEqual(expectedResult);
  });

  it('should not find any account', async() => {
    mockRepository.findById.mockResolvedValue(null);

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(2);

    return service.execute('id').catch(err => {
      expect(err).toBeInstanceOf(NotFoundException);
      expect(err.response.message).toBe('Conta não encontrada na base de dados.');
    });
  });
});
