import { Socket } from 'socket.io';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { JwtWebSocketStrategy } from './websocket.strategy';

function makeSocket(authorization?: string): Socket {
  return {
    handshake: {
      headers: {
        authorization,
      },
    },
  } as unknown as Socket;
}

describe('JwtWebSocketStrategy - Unit tests', () => {
  let sut: JwtWebSocketStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    sut = new JwtWebSocketStrategy();
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

  describe('extractJwtFromSocket', () => {
    it('should extract the token when the authorization header uses the Bearer scheme', () => {
      // Arrange
      const socket = makeSocket('Bearer some-jwt-token');

      // Act
      const result = (JwtWebSocketStrategy as any).extractJwtFromSocket(socket);

      // Assert
      expect(result).toBe('some-jwt-token');
    });

    it('should return null when the authorization header is missing', () => {
      // Arrange
      const socket = makeSocket(undefined);

      // Act
      const result = (JwtWebSocketStrategy as any).extractJwtFromSocket(socket);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when the authorization header does not use the Bearer scheme', () => {
      // Arrange
      const socket = makeSocket('Basic some-credentials');

      // Act
      const result = (JwtWebSocketStrategy as any).extractJwtFromSocket(socket);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when handshake headers are absent', () => {
      // Arrange
      const socket = { handshake: {} } as unknown as Socket;

      // Act
      const result = (JwtWebSocketStrategy as any).extractJwtFromSocket(socket);

      // Assert
      expect(result).toBeNull();
    });
  });
});
