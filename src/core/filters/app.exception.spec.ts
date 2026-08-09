import { AppException } from './app.exception';

describe('AppException - Unit tests', () => {
  describe('constructor', () => {
    describe('Happy path', () => {
      it('should create an exception with the message when code is not provided', () => {
        // Act
        const sut = new AppException('erro genérico');

        // Assert
        expect(sut.message).toBe('erro genérico');
        expect(sut.code).toBeUndefined();
      });

      it('should create an exception with the message and code when both are provided', () => {
        // Act
        const sut = new AppException('erro genérico', 400);

        // Assert
        expect(sut.message).toBe('erro genérico');
        expect(sut.code).toBe(400);
      });

      it('should be an instance of Error and AppException', () => {
        // Act
        const sut = new AppException('erro genérico');

        // Assert
        expect(sut).toBeInstanceOf(Error);
        expect(sut).toBeInstanceOf(AppException);
      });

      it('should be throwable and catchable as AppException', () => {
        // Act & Assert
        expect(() => {
          throw new AppException('erro genérico', 500);
        }).toThrow(AppException);
      });
    });

    describe('Edge cases', () => {
      it('should set message to an empty string when message is an empty string', () => {
        // Act
        const sut = new AppException('');

        // Assert
        expect(sut.message).toBe('');
      });

      it('should store code 0 as-is instead of treating it as undefined', () => {
        // Act
        const sut = new AppException('erro genérico', 0);

        // Assert
        expect(sut.code).toBe(0);
      });
    });
  });

  describe('code', () => {
    describe('Happy path', () => {
      it('should return the code passed to the constructor', () => {
        // Arrange
        const sut = new AppException('erro genérico', 500);

        // Act
        const result = sut.code;

        // Assert
        expect(result).toBe(500);
      });
    });

    describe('Edge cases', () => {
      it('should return undefined when code was not provided', () => {
        // Arrange
        const sut = new AppException('erro genérico');

        // Act
        const result = sut.code;

        // Assert
        expect(result).toBeUndefined();
      });
    });
  });
});
