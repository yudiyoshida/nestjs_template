import { BadRequestException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { isJWT } from 'class-validator';

import { AccountInMemoryRepository } from 'src/modules/account/repositories/adapters/account-in-memory.repository';
import { TOKENS } from 'src/shared/di/tokens';
import { BcryptAdapterService } from 'src/shared/helpers/hashing/adapters/bcrypt.service';
import { CreateAccountService } from '../../../account/use-cases/create-account/create-account.service';
import { CreateAccountDto } from '../../../account/use-cases/create-account/dtos/create-account.dto';
import { LoginDto } from './dtos/login.dto';
import { LoginService } from './login.service';

describe('LoginService', () => {
  let service: LoginService;
  let createAccountService: CreateAccountService;

  const data: CreateAccountDto = {
    name: 'Jhon Doe',
    email: 'jhondoe@email.com',
    password: 'abc12345',
  };

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: 'secret-for-tests-only' }),
      ],
      providers: [
        LoginService,
        CreateAccountService,
        {
          provide: TOKENS.IAccountRepository,
          useClass: AccountInMemoryRepository,
        },
        {
          provide: TOKENS.IHashingService,
          useClass: BcryptAdapterService,
        },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
    createAccountService = module.get<CreateAccountService>(CreateAccountService);

    // register an account.
    await createAccountService.execute({
      name: data.name,
      email: data.email,
      password: data.password,
    });
  });

  it('should return 400 when providing incorrect email', async() => {
    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(2);

    const credentials: LoginDto = {
      email: `${data.email}.br`,
      password: data.password,
    };

    return service.execute(credentials).catch(err => {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response.message).toBe('Credenciais incorretas.');
    });
  });

  it('should return 400 when providing incorrect password', async() => {
    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(2);

    const credentials: LoginDto = {
      email: data.email,
      password: `${data.password}!!`,
    };

    return service.execute(credentials).catch(err => {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response.message).toBe('Credenciais incorretas.');
    });
  });

  it('should return the access token when providing correct credentials', async() => {
    const credentials: LoginDto = {
      email: data.email,
      password: data.password,
    };

    const result = await service.execute(credentials);

    expect(result).toHaveProperty('accessToken');
  });

  it('should return a valid JWT as access token', async() => {
    const credentials: LoginDto = {
      email: data.email,
      password: data.password,
    };

    const result = await service.execute(credentials);

    expect(isJWT(result.accessToken)).toBeTruthy();
  });
});
