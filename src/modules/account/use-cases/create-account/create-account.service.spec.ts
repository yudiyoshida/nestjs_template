import { TestBed } from '@automock/jest';
import { ConflictException } from '@nestjs/common';
import { TOKENS } from 'src/shared/di/tokens';
import { BcryptAdapterService } from 'src/shared/helpers/hashing/adapters/bcrypt.service';
import { Account } from '../../entities/account.entity';
import { AccountInMemoryAdapterRepository } from '../../repositories/adapters/account-in-memory.repository';
import { CreateAccountService } from './create-account.service';
import { CreateAccountDto } from './dtos/create-account.dto';

const data: CreateAccountDto = {
  name: 'Jhon Doe',
  email: 'jhondoe@email.com',
  password: '123456789',
};

const account: Account = {
  id: 'acc-id',
  name: 'Jhon Doe',
  email: 'jhondoe@email.com',
  password: '123456789',
  status: 'ativo',
  permissions: [],
};

describe('CreateAccountService', () => {
  let service: CreateAccountService;
  let mockHashing: jest.Mocked<BcryptAdapterService>;
  let mockRepository: jest.Mocked<AccountInMemoryAdapterRepository>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(CreateAccountService).compile();

    service = unit;
    mockHashing = unitRef.get(TOKENS.IHashingService);
    mockRepository = unitRef.get(TOKENS.IAccountRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw an error when the email provided already exists', async() => {
    mockRepository.findByEmail.mockResolvedValue(account);

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(5);

    return service.execute({ ...data }).catch(err => {
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.response.message).toBe('Email já está sendo utilizado.');

      expect(mockRepository.findByEmail).toHaveBeenCalledExactlyOnceWith(data.email);
      expect(mockHashing.hash).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  it('should create a new account when the email provided is unique', async() => {
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.save.mockResolvedValue({} as Account);
    mockHashing.hash.mockReturnValue('hashed-password');

    const result = await service.execute({ ...data });

    expect(result).toEqual({});
    expect(mockRepository.findByEmail).toHaveBeenCalledOnce();
    expect(mockHashing.hash).toHaveBeenCalledExactlyOnceWith(data.password);
    expect(mockRepository.save).toHaveBeenCalledOnce();
  });

  it('should not return the password and permissions when creating an account', async() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, permissions, ...expectedResult } = account;

    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.save.mockResolvedValue(account);
    mockHashing.hash.mockReturnValue('hashed-password');

    const result = await service.execute({ ...data });

    expect(result).toEqual(expectedResult);
    expect(mockRepository.findByEmail).toHaveBeenCalledOnce();
    expect(mockHashing.hash).toHaveBeenCalledExactlyOnceWith(data.password);
    expect(mockRepository.save).toHaveBeenCalledOnce();
  });
});
