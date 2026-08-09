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
    ])('should throw InvalidEmailError when providing an invalid email (%s)', (email: any) => {
      // Act & Assert
      expect(() => new Email(email)).toThrow(InvalidEmailError);
    });
  });
});
