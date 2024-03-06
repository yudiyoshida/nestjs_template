import { TestBed } from '@automock/jest';
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Account } from 'src/modules/account/entities/account.entity';
import { AuthorizationGuard } from './authorization.guard';

function ctxMockFactory(account?: any) {
  return createMock<ExecutionContext>({
    switchToHttp: () => ({
      getRequest: () => ({
        auth: account,
      }),
    }),
  });
};

describe('AuthorizationGuard', () => {
  let guard: AuthorizationGuard;
  let mockReflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(AuthorizationGuard).compile();

    guard = unit;
    mockReflector = unitRef.get(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw an error when the route (that requires authentication) does not define a permission', async() => {
    const ctx = ctxMockFactory();
    mockReflector.getAllAndOverride.mockReturnValue(null);

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(3);

    return guard.canActivate(ctx).catch(err => {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(err.response.message).toBe('Você não possui permissão para acessar este recurso.');
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledOnce();
    });
  });

  it('should throw an error when the account does not have the required permission', async() => {
    const account = createMock<Account>({
      permissions: [{ action: 'READ' }, { action:'DELETE' }],
    });
    const ctx = ctxMockFactory(account);

    mockReflector.getAllAndOverride.mockReturnValue('CREATE');

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(3);

    return guard.canActivate(ctx).catch(err => {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(err.response.message).toBe('Você não possui permissão para acessar este recurso.');
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledOnce();
    });
  });

  it('should return true when the account have the required permission', async() => {
    const account = createMock<Account>({
      permissions: [{ action: 'READ' }, { action:'DELETE' }, { action: 'CREATE' }],
    });
    const ctx = ctxMockFactory(account);

    mockReflector.getAllAndOverride.mockReturnValue('CREATE');

    const result = await guard.canActivate(ctx);

    expect(result).toBeTrue();
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledOnce();
  });
});
