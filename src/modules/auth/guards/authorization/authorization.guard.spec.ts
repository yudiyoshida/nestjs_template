import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

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

describe('AuthorizationGuard', () => {
  let guard: AuthorizationGuard;

  let reflectorMock: jest.Mock;
  let getAccountByIdServiceMock: jest.Mock;

  beforeEach(async() => {
    reflectorMock = jest.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('CREATE');

    getAccountByIdServiceMock = jest.fn()
      .mockResolvedValueOnce({
        permissions: [
          { action: 'READ' },
          { action: 'UPDATE' },
          { action: 'DELETE' },
        ],
      })
      .mockResolvedValueOnce({
        permissions:[
          { action: 'READ' },
          { action: 'CREATE' },
          { action: 'UPDATE' },
          { action: 'DELETE' },
        ],
      });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationGuard,
        {
          provide: GetAccountByIdService,
          useValue: { execute: getAccountByIdServiceMock },
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: reflectorMock },
        },
      ],
    }).compile();

    guard = module.get<AuthorizationGuard>(AuthorizationGuard);
  });

  it('should throw an error when the route (that required authentication) does not define a permission', async() => {
    const ctx = ctxMockFactory();

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(2);

    return guard.canActivate(ctx).catch(err => {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(err.response.message).toBe('Você não possui permissão para acessar este recurso.');
    });
  });

  it('should throw an error when the account does not have the required permission', async() => {
    const ctx = ctxMockFactory();

    // 1st call to ignore first return (empty array).
    reflectorMock();

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(2);

    return guard.canActivate(ctx).catch(err => {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(err.response.message).toBe('Você não possui permissão para acessar este recurso.');
    });
  });

  it('should return true when the account have the required permission', async() => {
    const ctx = ctxMockFactory();

    // 1st call to ignore returned value (empty array).
    reflectorMock();

    // 1st call to ignore returned value (list of permissions without required permission).
    getAccountByIdServiceMock();

    const result = await guard.canActivate(ctx);

    expect(result).toBeTrue();
  });
});
