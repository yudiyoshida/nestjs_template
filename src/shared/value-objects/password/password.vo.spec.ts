import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Password } from './password.vo';

jest.mock('bcrypt');
jest.mock('crypto');

describe('Password - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('compare', () => {
    describe('Happy path', () => {
      it.each([
        [true],
        [false],
      ])('should return %s when bcrypt.compareSync returns %s', (result: boolean) => {
        // Arrange
        (bcrypt.compareSync as jest.Mock).mockReturnValue(result);

        // Act
        const sut = Password.compare('plain-password', 'hashed-password');

        // Assert
        expect(sut).toBe(result);
        expect(bcrypt.compareSync).toHaveBeenCalledWith('plain-password', 'hashed-password');
      });
    });
  });

  describe('generateRandom', () => {
    describe('Happy path', () => {
      it('should return a base64url-encoded random string', () => {
        // Arrange
        const toString = jest.fn().mockReturnValue('random-base64url-value');
        (randomBytes as jest.Mock).mockReturnValue({ toString });

        // Act
        const sut = Password.generateRandom();

        // Assert
        expect(sut).toBe('random-base64url-value');
        expect(randomBytes).toHaveBeenCalledWith(12);
        expect(toString).toHaveBeenCalledWith('base64url');
      });
    });
  });

  describe('constructor', () => {
    beforeEach(() => {
      (bcrypt.genSaltSync as jest.Mock).mockReturnValue('generated-salt');
      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed-password');
    });

    describe('Happy path', () => {
      it('should hash the password and expose it via the value getter', () => {
        // Act
        const sut = new Password('my-password');

        // Assert
        expect(sut.value).toBe('hashed-password');
        expect(bcrypt.genSaltSync).toHaveBeenCalledWith(10);
        expect(bcrypt.hashSync).toHaveBeenCalledWith('my-password', 'generated-salt');
      });
    });

    describe('Edge cases', () => {
      it('should hash an empty string password', () => {
        // Act
        const sut = new Password('');

        // Assert
        expect(sut.value).toBe('hashed-password');
        expect(bcrypt.hashSync).toHaveBeenCalledWith('', 'generated-salt');
      });

      it('should hash a whitespace-only password', () => {
        // Act
        const sut = new Password('   ');

        // Assert
        expect(sut.value).toBe('hashed-password');
        expect(bcrypt.hashSync).toHaveBeenCalledWith('   ', 'generated-salt');
      });
    });
  });
});
