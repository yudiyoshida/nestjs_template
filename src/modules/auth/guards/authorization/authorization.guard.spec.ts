import { TestBed } from '@automock/jest';
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Account } from 'src/modules/account/entities/account.entity';
import { GetAccountByIdService } from 'src/modules/account/use-cases/get-account-by-id/get-account-by-id.service';
import { AuthorizationGuard } from './authorization.guard';

function ctxMockFactory() {
  return createMock<ExecutionContext>({
    switchToHttp: () => ({
      getRequest: () => ({
        auth: { sub: 'randomID' },
      }),
    }),
  });
};

const account = {
  id: 'acc-id',
  name: 'Jhon Doe',
  email: 'jhondoe@email.com',
  password: '123456',
};

const accountWithNoPermission: Account = {
  ...account,
  permissions: [{ action: 'READ' }],
};

const accountWithPermission: Account = {
  ...account,
  permissions: [{ action: 'READ' }, { action: 'CREATE' }],
};

describe('AuthorizationGuard', () => {
  let guard: AuthorizationGuard;
  let mockReflector: jest.Mocked<Reflector>;
  let mockGetAccountByIdService: jest.Mocked<GetAccountByIdService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(AuthorizationGuard).compile();

    guard = unit;
    mockReflector = unitRef.get(Reflector);
    mockGetAccountByIdService = unitRef.get(GetAccountByIdService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw an error when the route (that required authentication) does not define a permission', async() => {
    const ctx = ctxMockFactory();
    mockReflector.getAllAndOverride.mockReturnValue(null);

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(4);

    return guard.canActivate(ctx).catch(err => {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(err.response.message).toBe('Você não possui permissão para acessar este recurso.');
      expect(mockReflector.getAllAndOverride).toHaveBeenCalled();
      expect(mockGetAccountByIdService.execute).not.toHaveBeenCalled();
    });
  });

  it('should throw an error when the account does not have the required permission', async() => {
    const ctx = ctxMockFactory();
    mockReflector.getAllAndOverride.mockReturnValue('CREATE');
    mockGetAccountByIdService.execute.mockResolvedValue(accountWithNoPermission);

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(4);

    return guard.canActivate(ctx).catch(err => {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(err.response.message).toBe('Você não possui permissão para acessar este recurso.');
      expect(mockReflector.getAllAndOverride).toHaveBeenCalled();
      expect(mockGetAccountByIdService.execute).toHaveBeenCalled();
    });
  });

  it('should return true when the account have the required permission', async() => {
    const ctx = ctxMockFactory();
    mockReflector.getAllAndOverride.mockReturnValue('CREATE');
    mockGetAccountByIdService.execute.mockResolvedValue(accountWithPermission);

    const result = await guard.canActivate(ctx);

    expect(result).toBeTrue();
    expect(mockReflector.getAllAndOverride).toHaveBeenCalled();
    expect(mockGetAccountByIdService.execute).toHaveBeenCalled();
  });
});
