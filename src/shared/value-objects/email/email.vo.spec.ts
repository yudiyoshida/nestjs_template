import { InvalidEmailError } from './email.error';
import { Email } from './email.vo';

describe('Email - Unit tests', () => {
  describe('Happy path', () => {
    it.each([
      'user@example.com',
      'user.name@example.com',
      'user-name_1@example.com',
      'user@mail.example.com',
      'user@example.co',
      'user@example.info',
    ])('should create an email value object when providing a valid email (%s)', (input: string) => {
      // Act
      const sut = new Email(input);

      // Assert
      expect(sut.value).toBe(input);
    });

    it.each([
      ['  user@example.com  ', 'user@example.com'],
      ['User@Example.COM', 'user@example.com'],
      ['\tUSER.NAME@EXAMPLE.com\n', 'user.name@example.com'],
    ])('should normalize %s to %s', (input: string, expected: string) => {
      // Act
      const sut = new Email(input);

      // Assert
      expect(sut.value).toBe(expected);
    });
  });

  describe('Error path', () => {
    it.each([
      null,
      undefined,
      '',
      '           ',
      'userexample.com',
      'user@example',
      'user@example.c',
      'user@example.abcde',
      'user @example.com',
      'user@@example.com',
      123,
      {},
      [],
    ])('should throw InvalidEmailError when providing an invalid email (%s)', (email: any) => {
      // Act & Assert
      expect(() => new Email(email)).toThrow(InvalidEmailError);
    });
  });

  describe('Edge cases', () => {
    it('should keep the value immutable after creation', () => {
      // Arrange
      const sut = new Email('  User@Example.COM  ');

      // Act
      const result = sut.value;

      // Assert
      expect(result).toBe('user@example.com');
      expect(sut.value).toBe('user@example.com');
    });
  });
});
