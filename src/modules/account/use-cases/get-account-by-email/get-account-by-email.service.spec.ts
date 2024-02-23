import { Test, TestingModule } from '@nestjs/testing';

import { TOKENS } from 'src/shared/di/tokens';
import { IAccountRepository } from '../../repositories/account-repository.interface';
import { GetAccountByEmailService } from './get-account-by-email.service';

describe('GetAccountByEmailService', () => {
  let service: GetAccountByEmailService;
  let repositoryMock: IAccountRepository;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAccountByEmailService,
        {
          provide: TOKENS.IAccountRepository,
          useFactory: () => ({
            findByEmail: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<GetAccountByEmailService>(GetAccountByEmailService);
    repositoryMock = module.get<IAccountRepository>(TOKENS.IAccountRepository);
  });

  it('should call the repository with correct arguments', async() => {
    const email = 'jhondoe@email.com';

    await service.execute(email);

    expect(repositoryMock.findByEmail).toHaveBeenCalledExactlyOnceWith(email);
  });
});
