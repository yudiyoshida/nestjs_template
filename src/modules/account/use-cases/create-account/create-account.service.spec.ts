import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { TOKENS } from 'src/shared/di/tokens';
import { IHashingService } from 'src/shared/helpers/hashing/hashing.interface';
import { IAccountRepository } from '../../repositories/account-repository.interface';
import { CreateAccountService } from './create-account.service';
import { CreateAccountDto } from './dtos/create-account.dto';

const data: CreateAccountDto = {
  name: 'Jhon Doe',
  email: 'jhondoe@email.com',
  password: '123456789',
};

describe('CreateAccountService', () => {
  let service: CreateAccountService;
  let repositoryMock: IAccountRepository;
  let hashingMock: IHashingService;

  let findByEmailMock: jest.Mock;

  beforeEach(async() => {
    findByEmailMock = jest.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValue(data);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAccountService,
        {
          provide: TOKENS.IAccountRepository,
          useFactory: () => ({
            findByEmail: findByEmailMock,
            save: jest.fn().mockResolvedValue(data),
          }),
        },
        {
          provide: TOKENS.IHashingService,
          useFactory: () => ({
            hash: jest.fn().mockReturnValue('hashed-password'),
          }),
        },
      ],
    }).compile();

    service = module.get<CreateAccountService>(CreateAccountService);
    repositoryMock = module.get<IAccountRepository>(TOKENS.IAccountRepository);
    hashingMock = module.get<IHashingService>(TOKENS.IHashingService);
  });

  it('should throw an error when the email provided already exists', async() => {
    // call to ignore first mocked value (return null).
    findByEmailMock();

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(2);

    return service.execute({ ...data }).catch(err => {
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.response.message).toBe('Email já está sendo utilizado.');
    });
  });

  it('should create a new account when the email provided is unique', async() => {
    const result = await service.execute({ ...data });

    expect(result).toEqual(data);
  });

  it('should call the findByEmail with correct argument', async() => {
    await service.execute({ ...data });

    expect(repositoryMock.findByEmail).toHaveBeenCalledExactlyOnceWith(data.email);
  });

  it('should call the hashing service with correct argument', async() => {
    await service.execute({ ...data });

    expect(hashingMock.hash).toHaveBeenCalledExactlyOnceWith(data.password);
  });
});
