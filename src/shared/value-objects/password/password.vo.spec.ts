import { Password } from './password.vo';

describe('Password - Unit tests', () => {
  it('should create a new hashed password', () => {
    // Arrange
    const rawPassword = 'T0I2%kBmZez7';

    // Act
    const sut = new Password(rawPassword);

    // Assert
    expect(sut).toBeDefined();
    expect(sut.value).not.toBe(rawPassword);
  });

  it('should return true when comparing same password', () => {
    // Arrange
    const rawPassword = '123456789';

    // Act
    const sut = new Password(rawPassword);

    // Assert
    expect(Password.compare(rawPassword, sut.value)).toBe(true);
  });

  it('should return false when comparing different password', () => {
    // Arrange
    const rawPassword = '123456789';
    const anotherRawPassword = '987654321';

    // Act
    const sut = new Password(rawPassword);

    // Assert
    expect(Password.compare(anotherRawPassword, sut.value)).toBe(false);
  });

  it('should generate a random password with 16 characters', () => {
    // Act
    const sut = Password.generateRandom();

    // Assert
    expect(sut).toHaveLength(16);
  });
});
