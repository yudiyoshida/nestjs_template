import { randomInt } from 'crypto';
import { Code } from './code.vo';
import { InvalidExpirationTimeError } from './code.error';

jest.mock('crypto');

describe('Code - Unit tests', () => {
  const fixedNow = new Date('2026-01-01T00:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Happy path', () => {
    it('should create a 6-digit numeric code when expirationTimeInMinutes is valid', () => {
      // Arrange
      (randomInt as unknown as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(5)
        .mockReturnValueOnce(6);

      // Act
      const sut = new Code(5);

      // Assert
      expect(sut.value.code).toBe('123456');
      expect(randomInt).toHaveBeenCalledTimes(6);
      expect(randomInt).toHaveBeenCalledWith(0, 10);
    });

    it('should calculate expiresIn as current time plus expiration time in milliseconds', () => {
      // Act
      const sut = new Code(5);

      // Assert
      expect(sut.value.expiresIn).toBe(fixedNow.getTime() + 5 * 60 * 1000);
    });
  });

  describe('Error path', () => {
    it.each([
      0,
      -1,
      -100,
    ])('should throw InvalidExpirationTimeError when expirationTimeInMinutes is %s', (expirationTimeInMinutes: number) => {
      // Act & Assert
      expect(() => new Code(expirationTimeInMinutes)).toThrow(InvalidExpirationTimeError);
    });
  });

  describe('Edge cases', () => {
    it('should accept a fractional expirationTimeInMinutes and calculate expiresIn correctly', () => {
      // Act
      const sut = new Code(0.5);

      // Assert
      expect(sut.value.expiresIn).toBe(fixedNow.getTime() + 0.5 * 60 * 1000);
    });
  });
});
