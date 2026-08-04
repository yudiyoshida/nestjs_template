import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy - Unit tests', () => {
  let sut: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    sut = new JwtStrategy();
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should map the decoded payload to sub and roles', () => {
    // Arrange
    const decodedPayload = {
      sub: 'account-id',
      roles: [AccountRole.STUDENT],
      iat: 1700000000,
      exp: 1700003600,
      jti: 'some-jwt-id',
    };

    // Act
    const result = sut.validate(decodedPayload);

    // Assert
    expect(result).toEqual({
      sub: 'account-id',
      roles: [AccountRole.STUDENT],
    });
  });

  it('should preserve every role from the decoded payload', () => {
    // Arrange
    const decodedPayload = {
      sub: 'account-id',
      roles: [AccountRole.ADMIN, AccountRole.STUDENT],
      iat: 1700000000,
      exp: 1700003600,
      jti: 'some-jwt-id',
    };

    // Act
    const result = sut.validate(decodedPayload);

    // Assert
    expect(result).toEqual({
      sub: 'account-id',
      roles: [AccountRole.ADMIN, AccountRole.STUDENT],
    });
  });
});
