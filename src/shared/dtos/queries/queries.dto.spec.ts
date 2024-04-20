import { BadRequestException } from '@nestjs/common';
import { dtoValidator } from 'src/shared/validators/dto-validator';
import { QueriesDto } from './queries.dto';

describe('QueriesDto', () => {
  describe('page field', () => {
    it('should throw an error when providing a string to page', async() => {
      // Arrange
      const data = { page: 'abc' };

      // Act & Assert
      expect.assertions(3);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número inteiro.');
        expect(err.getResponse().message).toContain('page deve ser um número positivo.');
      });
    });

    it('should throw an error when providing a boolean to page', async() => {
      // Arrange
      const data = { page: true };

      // Act & Assert
      expect.assertions(3);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número inteiro.');
        expect(err.getResponse().message).toContain('page deve ser um número positivo.');
      });
    });

    it('should throw an error when providing an object to page', async() => {
      // Arrange
      const data = { page: {} };

      // Act & Assert
      expect.assertions(3);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número inteiro.');
        expect(err.getResponse().message).toContain('page deve ser um número positivo.');
      });
    });

    it('should throw an error when providing an array to page', async() => {
      // Arrange
      const data = { page: [] };

      // Act & Assert
      expect.assertions(3);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número inteiro.');
        expect(err.getResponse().message).toContain('page deve ser um número positivo.');
      });
    });

    it('should throw an error when providing a positive decimal number to page', async() => {
      // Arrange
      const data = { page: 1.4 };

      // Act & Assert
      expect.assertions(2);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número inteiro.');
      });
    });

    it('should throw an error when providing a negative decimal number to page', async() => {
      // Arrange
      const data = { page: -8.6 };

      // Act & Assert
      expect.assertions(3);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número inteiro.');
        expect(err.getResponse().message).toContain('page deve ser um número positivo.');
      });
    });

    it('should throw an error when providing zero to page', async() => {
      // Arrange
      const data = { page: 0 };

      // Act & Assert
      expect.assertions(2);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número positivo.');
      });
    });

    it('should throw an error when providing a negative integer number to page', async() => {
      // Arrange
      const data = { page: -1 };

      // Act & Assert
      expect.assertions(2);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número positivo.');
      });
    });

    it('should not throw an error when providing a positive integer number to page (string)', async() => {
      // Arrange
      const data = { page: '3' };

      // Act
      const result = await dtoValidator(QueriesDto, data);

      // Assert
      expect(result).toBeInstanceOf(QueriesDto);
      expect(result).toHaveProperty('page', 3);
    });

    it('should not throw an error when providing a positive integer number to page (number)', async() => {
      // Arrange
      const data = { page: 3 };

      // Act
      const result = await dtoValidator(QueriesDto, data);

      // Assert
      expect(result).toBeInstanceOf(QueriesDto);
      expect(result).toHaveProperty('page', 3);
    });

    it('should not throw an error when not providing any page', async() => {
      // Arrange
      const data = { };

      // Act
      const result = await dtoValidator(QueriesDto, data);

      // Assert
      expect(result).toBeInstanceOf(QueriesDto);
    });

    it('should not throw an error when providing null to page', async() => {
      // Arrange
      const data = { page: null };

      // Act
      const result = await dtoValidator(QueriesDto, data);

      // Assert
      expect(result).toBeInstanceOf(QueriesDto);
    });
  });

  describe('size field', () => {
    it('should throw an error when providing a string to size', async() => {
      // Arrange
      const data = { size: 'abc' };

      // Act & Assert
      expect.assertions(3);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número inteiro.');
        expect(err.getResponse().message).toContain('size deve ser um número positivo.');
      });
    });

    it('should throw an error when providing a boolean to size', async() => {
      // Arrange
      const data = { size: true };

      // Act & Assert
      expect.assertions(3);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número inteiro.');
        expect(err.getResponse().message).toContain('size deve ser um número positivo.');
      });
    });

    it('should throw an error when providing an object to size', async() => {
      // Arrange
      const data = { size: {} };

      // Act & Assert
      expect.assertions(3);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número inteiro.');
        expect(err.getResponse().message).toContain('size deve ser um número positivo.');
      });
    });

    it('should throw an error when providing an array to size', async() => {
      // Arrange
      const data = { size: [] };

      // Act & Assert
      expect.assertions(3);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número inteiro.');
        expect(err.getResponse().message).toContain('size deve ser um número positivo.');
      });
    });

    it('should throw an error when providing a positive decimal number to size', async() => {
      // Arrange
      const data = { size: 1.4 };

      // Act & Assert
      expect.assertions(2);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número inteiro.');
      });
    });

    it('should throw an error when providing a negative decimal number to size', async() => {
      // Arrange
      const data = { size: -8.6 };

      // Act & Assert
      expect.assertions(3);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número inteiro.');
        expect(err.getResponse().message).toContain('size deve ser um número positivo.');
      });
    });

    it('should throw an error when providing zero to size', async() => {
      // Arrange
      const data = { size: 0 };

      // Act & Assert
      expect.assertions(2);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número positivo.');
      });
    });

    it('should throw an error when providing a negative integer number to size', async() => {
      // Arrange
      const data = { size: -1 };

      // Act & Assert
      expect.assertions(2);
      return dtoValidator(QueriesDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número positivo.');
      });
    });

    it('should not throw an error when providing a positive integer number to size (string)', async() => {
      // Arrange
      const data = { size: '3' };

      // Act
      const result = await dtoValidator(QueriesDto, data);

      // Assert
      expect(result).toBeInstanceOf(QueriesDto);
      expect(result).toHaveProperty('size', 3);
    });

    it('should not throw an error when providing a positive integer number to size (number)', async() => {
      // Arrange
      const data = { size: 3 };

      // Act
      const result = await dtoValidator(QueriesDto, data);

      // Assert
      expect(result).toBeInstanceOf(QueriesDto);
      expect(result).toHaveProperty('size', 3);
    });

    it('should not throw an error when not providing any size', async() => {
      // Arrange
      const data = { };

      // Act
      const result = await dtoValidator(QueriesDto, data);

      // Assert
      expect(result).toBeInstanceOf(QueriesDto);
    });

    it('should not throw an error when providing null to size', async() => {
      // Arrange
      const data = { size: null };

      // Act
      const result = await dtoValidator(QueriesDto, data);

      // Assert
      expect(result).toBeInstanceOf(QueriesDto);
    });
  });

  describe('all fields together', () => {
    it('should pass all tests', async() => {
      // Arrange
      const data = { page: '4002', size: '8922' };

      // Act
      const result = await dtoValidator(QueriesDto, data);

      // Assert
      expect(result).toBeInstanceOf(QueriesDto);
      expect(result.page).toBe(+data.page);
      expect(result.size).toBe(+data.size);
    });
  });
});
