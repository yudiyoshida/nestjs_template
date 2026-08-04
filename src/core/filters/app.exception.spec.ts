import { AppException } from './app.exception';

describe('AppException - Unit tests', () => {
  it('should set the message and be an instance of Error', () => {
    // Act
    const sut = new AppException('Something went wrong');

    // Assert
    expect(sut).toBeInstanceOf(Error);
    expect(sut).toBeInstanceOf(AppException);
    expect(sut.message).toBe('Something went wrong');
  });

  it('should set the code when provided', () => {
    // Act
    const sut = new AppException('Conflict', 409);

    // Assert
    expect(sut.code).toBe(409);
  });

  it('should return undefined code when not provided', () => {
    // Act
    const sut = new AppException('Generic error');

    // Assert
    expect(sut.code).toBeUndefined();
  });

  it('should be throwable and catchable as AppException', () => {
    // Act & Assert
    expect(() => {
      throw new AppException('Boom', 500);
    }).toThrow(AppException);
  });
});
