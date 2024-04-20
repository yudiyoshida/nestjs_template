import { TestBed } from '@automock/jest';
import { createMock } from '@golevelup/ts-jest';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BcryptAdapterService } from 'src/infra/hashing/adapters/bcrypt.service';
import { Account } from 'src/modules/account/entities/account.entity';
import { GetAccountByEmailService } from 'src/modules/account/use-cases/get-account-by-email/get-account-by-email.service';
import { TOKENS } from 'src/shared/ioc/tokens';
import { LoginDto } from './dtos/login.dto';
import { LoginService } from './login.service';

const credential: LoginDto = {
  email: 'jhondoe@email.com',
  password: '123456',
};

describe('LoginService', () => {
  let service: LoginService;
  let mockGetAccountByEmailService: jest.Mocked<GetAccountByEmailService>;
  let mockHashingService: jest.Mocked<BcryptAdapterService>;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(LoginService).compile();

    service = unit;
    mockGetAccountByEmailService = unitRef.get(GetAccountByEmailService);
    mockHashingService = unitRef.get(TOKENS.IHashingService);
    mockJwtService = unitRef.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw an error when cannot find an account with provided email', async() => {
    mockGetAccountByEmailService.execute.mockResolvedValue(null);

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(5);

    return service.execute({ ...credential }).catch(err => {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response.message).toBe('Credenciais incorretas.');

      expect(mockGetAccountByEmailService.execute).toHaveBeenCalledExactlyOnceWith(credential.email);
      expect(mockHashingService.compare).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  it('should throw an error when the provided password is incorrect', async() => {
    const account = createMock<Account>({ password: 'hashed-password' });

    mockGetAccountByEmailService.execute.mockResolvedValue(account);
    mockHashingService.compare.mockReturnValue(false);

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(5);

    return service.execute({ ...credential }).catch(err => {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response.message).toBe('Credenciais incorretas.');

      expect(mockGetAccountByEmailService.execute).toHaveBeenCalledOnce();
      expect(mockHashingService.compare).toHaveBeenCalledExactlyOnceWith(credential.password, account.password);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  it('should return an access token when provided credentials are correct', async() => {
    mockGetAccountByEmailService.execute.mockResolvedValue({} as Account);
    mockHashingService.compare.mockReturnValue(true);

    const result = await service.execute({ ...credential });

    expect(result).toHaveProperty('accessToken');
    expect(mockGetAccountByEmailService.execute).toHaveBeenCalledOnce();
    expect(mockHashingService.compare).toHaveBeenCalledOnce();
    expect(mockJwtService.sign).toHaveBeenCalledOnce();
  });
});
