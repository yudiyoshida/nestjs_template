import { TestBed } from '@automock/jest';
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Account } from 'src/modules/account/entities/account.entity';
import { GetAccountByIdService } from 'src/modules/account/use-cases/get-account-by-id/get-account-by-id.service';
import { AuthenticationGuard } from './authentication.guard';

function ctxMockFactory(token: string) {
  return createMock<ExecutionContext>({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: token },
      }),
    }),
  });
};

describe('AuthenticationGuard', () => {
  let guard: AuthenticationGuard;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockGetAccountByIdService: jest.Mocked<GetAccountByIdService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(AuthenticationGuard).compile();

    guard = unit;
    mockJwtService = unitRef.get(JwtService);
    mockGetAccountByIdService = unitRef.get(GetAccountByIdService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw an error when not providing any token', async() => {
    const ctx = ctxMockFactory('');

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(4);

    return guard.canActivate(ctx).catch(err => {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.response.message).toBe('É necessário estar autenticado.');

      expect(mockJwtService.verify).not.toHaveBeenCalled();
      expect(mockGetAccountByIdService.execute).not.toHaveBeenCalled();
    });
  });

  it('should throw an error when not providing a bearer token', async() => {
    const ctx = ctxMockFactory('notBearer token');

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(4);

    return guard.canActivate(ctx).catch(err => {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.response.message).toBe('É necessário estar autenticado.');

      expect(mockJwtService.verify).not.toHaveBeenCalled();
      expect(mockGetAccountByIdService.execute).not.toHaveBeenCalled();
    });
  });

  it('should throw an error when not providing a valid bearer token', async() => {
    const ctx = ctxMockFactory('Bearer invalidToken');
    mockJwtService.verify.mockImplementation(() => { throw new Error(); });

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(4);

    return guard.canActivate(ctx).catch(err => {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.response.message).toBe('É necessário estar autenticado.');

      expect(mockJwtService.verify).toHaveBeenCalledOnce();
      expect(mockGetAccountByIdService.execute).not.toHaveBeenCalled();
    });
  });

  it('should return true when providing valid bearer token', async() => {
    const ctx = ctxMockFactory('Bearer validToken');
    mockJwtService.verify.mockReturnValue({});
    mockGetAccountByIdService.execute.mockResolvedValue({} as Account);

    const result = await guard.canActivate(ctx);

    expect(result).toBeTrue();
    expect(mockJwtService.verify).toHaveBeenCalledOnce();
    expect(mockGetAccountByIdService.execute).toHaveBeenCalledOnce();
  });
});
