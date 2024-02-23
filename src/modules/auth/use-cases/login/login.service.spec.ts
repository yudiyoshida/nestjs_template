import { BadRequestException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { isJWT } from 'class-validator';
import { Account } from 'src/modules/account/entities/account.entity';
import { GetAccountByEmailService } from 'src/modules/account/use-cases/get-account-by-email/get-account-by-email.service';
import { TOKENS } from 'src/shared/di/tokens';
import { IHashingService } from 'src/shared/helpers/hashing/hashing.interface';
import { LoginService } from './login.service';

const account: Account = {
  id: 'random-id',
  name: 'Jhon Doe',
  email: 'jhondoe@email.com',
  password: 'jhondoe',
  permissions: [],
};

describe('LoginService', () => {
  let service: LoginService;
  let getAccountByEmailServiceMock: GetAccountByEmailService;
  let hashingServiceMock: IHashingService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: 'secret-for-tests-only' }),
      ],
      providers: [
        LoginService,
        {
          provide: GetAccountByEmailService,
          useFactory: () => ({
            execute: jest.fn((email: string) => {
              return (email === 'valid') ? account : null;
            }),
          }),
        },
        {
          provide: TOKENS.IHashingService,
          useFactory: () => ({
            compare: jest.fn((password: string) => {
              return password === 'valid';
            }),
          }),
        },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
    getAccountByEmailServiceMock = module.get<GetAccountByEmailService>(GetAccountByEmailService);
    hashingServiceMock = module.get<IHashingService>(TOKENS.IHashingService);
  });

  it('should throw an error when cannot find an account with provided email', async() => {
    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(2);

    return service.execute({ email: 'invalid', password: 'valid' }).catch(err => {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response.message).toBe('Credenciais incorretas.');
    });
  });

  it('should throw an error when provided password is incorrect', async() => {
    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(2);

    return service.execute({ email: 'valid', password: 'invalid' }).catch(err => {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response.message).toBe('Credenciais incorretas.');
    });
  });

  it('should return an access token when provided credentials are correct', async() => {
    const result = await service.execute({ email: 'valid', password: 'valid' });

    expect(result).toHaveProperty('accessToken');
  });

  it('should return a valid JWT as access token', async() => {
    const result = await service.execute({ email: 'valid', password: 'valid' });

    expect(isJWT(result.accessToken)).toBeTrue();
  });

  it('should call the getAccountByEmailService with correct arguments', async() => {
    await service.execute({ email: 'valid', password: 'valid' });

    expect(getAccountByEmailServiceMock.execute).toHaveBeenCalledExactlyOnceWith('valid');
  });

  it('should call the hashingService with correct arguments', async() => {
    await service.execute({ email: 'valid', password: 'valid' });

    expect(hashingServiceMock.compare).toHaveBeenCalledExactlyOnceWith('valid', account.password);
  });
});
