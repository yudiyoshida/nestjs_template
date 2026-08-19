import { InvalidPhoneError } from './phone.error';
import { Phone } from './phone.vo';

describe('Phone - Unit tests', () => {
  describe('Happy path', () => {
    it.each([
      '1123456789',
      '11987654321',
    ])('should create a phone value object when providing a valid phone (%s)', (phone: string) => {
      // Act
      const sut = new Phone(phone);

      // Assert
      expect(sut.value).toBe(phone);
    });
  });

  describe('Error path', () => {
    it.each([
      null,
      undefined,
      '',
      '           ',
      'abcdefghijk',
      '123456789',
      '123456789012',
      123,
      {},
      [],
    ])('should throw InvalidPhoneError when providing an invalid phone (%s)', (phone: any) => {
      // Act & Assert
      expect(() => new Phone(phone)).toThrow(InvalidPhoneError);
    });
  });

  describe('Edge cases', () => {
    it.each([
      ['(11) 3456-7890', '1134567890'],
      ['(11) 98765-4321', '11987654321'],
      ['11 3456-7890', '1134567890'],
      ['11-98765-4321', '11987654321'],
    ])('should sanitize %s to %s by removing non-digit characters', (input: string, expected: string) => {
      // Act
      const sut = new Phone(input);

      // Assert
      expect(sut.value).toBe(expected);
    });
  });
});
