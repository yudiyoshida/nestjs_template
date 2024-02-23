import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtService } from '@nestjs/jwt';
import { PayloadDto } from '../../types/payload.type';
import { AuthenticationGuard } from './authentication.guard';

const payload: PayloadDto = { sub: 'randomID' };

function ctxMockFactory(token: string) {
  return createMock<ExecutionContext>({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: token },
        auth: {},
      }),
    }),
  });
};

describe('AuthenticationGuard', () => {
  let guard: AuthenticationGuard;

  let jwtMock: jest.Mock;

  beforeEach(async() => {
    jwtMock = jest.fn()
      .mockImplementationOnce(() => { return payload; })
      .mockImplementationOnce(() => { throw new Error(); });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationGuard,
        {
          provide: JwtService,
          useValue: { verify: jwtMock },
        },
      ],
    }).compile();

    guard = module.get<AuthenticationGuard>(AuthenticationGuard);
  });

  it('should throw an error when not providing a bearer token', async() => {
    const ctx = ctxMockFactory('notBearer token');

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(2);

    return guard.canActivate(ctx).catch(err => {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.response.message).toBe('É necessário estar autenticado.');
    });
  });

  it('should throw an error when not providing a valid bearer token', async() => {
    const ctx = ctxMockFactory('Bearer invalidToken');

    // 1st call from mock to ignore first returned value.
    jwtMock();

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(2);

    return guard.canActivate(ctx).catch(err => {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.response.message).toBe('É necessário estar autenticado.');
    });
  });

  it('should return true when providing valid bearer token', async() => {
    const ctx = ctxMockFactory('Bearer validToken');

    const result = await guard.canActivate(ctx);

    expect(result).toBeTrue();
  });
});
