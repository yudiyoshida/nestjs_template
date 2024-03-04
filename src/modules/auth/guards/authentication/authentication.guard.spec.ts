import { TestBed } from '@automock/jest';
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PayloadDto } from '../../types/payload.type';
import { AuthenticationGuard } from './authentication.guard';

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

const payload: PayloadDto = {
  sub: 'randomID',
};

describe('AuthenticationGuard', () => {
  let guard: AuthenticationGuard;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(AuthenticationGuard).compile();

    guard = unit;
    mockJwtService = unitRef.get(JwtService);
  });

  it('should throw an error when not providing a bearer token', async() => {
    const ctx = ctxMockFactory('notBearer token');

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(3);

    return guard.canActivate(ctx).catch(err => {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.response.message).toBe('É necessário estar autenticado.');
      expect(mockJwtService.verify).not.toHaveBeenCalled();
    });
  });

  it('should throw an error when not providing a valid bearer token', async() => {
    const ctx = ctxMockFactory('Bearer invalidToken');
    mockJwtService.verify.mockImplementation(() => { throw new Error(); });

    // this line is here because a fulfilled promise won't fail the test.
    expect.assertions(2);

    return guard.canActivate(ctx).catch(err => {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.response.message).toBe('É necessário estar autenticado.');
    });
  });

  it('should return true when providing valid bearer token', async() => {
    const ctx = ctxMockFactory('Bearer validToken');
    mockJwtService.verify.mockReturnValue(payload);

    const result = await guard.canActivate(ctx);

    expect(result).toBeTrue();
  });
});
