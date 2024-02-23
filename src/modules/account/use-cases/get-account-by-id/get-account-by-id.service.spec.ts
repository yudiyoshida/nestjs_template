import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { TOKENS } from 'src/shared/di/tokens';
import { IAccountRepository } from '../../repositories/account-repository.interface';
import { GetAccountByIdService } from './get-account-by-id.service';

describe('GetAccountByIdService', () => {
  let service: GetAccountByIdService;
  let repositoryMock: IAccountRepository;

  let findByIdMock: jest.Mock;

  beforeEach(async() => {
    findByIdMock = jest.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAccountByIdService,
        {
          provide: TOKENS.IAccountRepository,
          useFactory: () => ({
            findById: findByIdMock,
          }),
        },
      ],
    }).compile();

    service = module.get<GetAccountByIdService>(GetAccountByIdService);
    repositoryMock = module.get<IAccountRepository>(TOKENS.IAccountRepository);
  });

  it('should call the repository with correct arguments', async() => {
    await service.execute('id');

    expect(repositoryMock.findById).toHaveBeenCalledExactlyOnceWith('id');
  });

  it('should find a specific account', async() => {
    const result = await service.execute('id');

    expect(result).toBeEmptyObject();
  });

  it('should not find any account', async() => {
    // first call to ignore empty object from mock (first return).
    findByIdMock();

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(2);

    return service.execute('id').catch(err => {
      expect(err).toBeInstanceOf(NotFoundException);
      expect(err.response.message).toEqual('Conta não encontrada na base de dados.');
    });
  });
});
