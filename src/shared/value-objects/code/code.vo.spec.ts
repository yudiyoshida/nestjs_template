import { isNumber } from 'class-validator';
import { InvalidExpirationTimeError } from './code.error';
import { Code } from './code.vo';

describe('Code - Unit tests', () => {
  it('should create a code with a value and expiration time', () => {
    // Arrange
    const expirationTimeInMinutes = 5;
    // Act
    const sut = new Code(expirationTimeInMinutes);

    // Assert
    expect(sut.value.code).toBeDefined();
    expect(sut.value.expiresIn).toBeDefined();
  });

  it('should generate a code with 6 digits', () => {
    // Arrange
    const expirationTimeInMinutes = 5;
    // Act
    const sut = new Code(expirationTimeInMinutes);

    // Assert
    expect(sut.value.code.length).toBe(6);
  });

  it('should generate a code with only numbers', () => {
    // Arrange
    const expirationTimeInMinutes = 5;
    // Act
    const sut = new Code(expirationTimeInMinutes);

    const isOnlyNumber = isNumber(+sut.value.code);
    // Assert
    expect(isOnlyNumber).toBe(true);
  });

  it.each([1, 5, 10, 250, 10999])('should generate a code that expires in %s minutes', (minutes: number) => {
    // Act
    const sut = new Code(minutes);
    const expirationTime = Date.now() + (minutes * 60 * 1000);
    // Assert
    expect(sut.value.expiresIn).toBe(expirationTime);
  });

  it('should throw an error when providing a negative expiration time', () => {
    // Act & Assert
    expect(() => new Code(-1)).toThrow('Tempo de expiração inválido');
    expect(() => new Code(-1)).toThrow(InvalidExpirationTimeError);
  });

  it('should throw an error when providing a zero expiration time', () => {
    // Act & Assert
    expect(() => new Code(0)).toThrow('Tempo de expiração inválido');
    expect(() => new Code(0)).toThrow(InvalidExpirationTimeError);
  });
});
