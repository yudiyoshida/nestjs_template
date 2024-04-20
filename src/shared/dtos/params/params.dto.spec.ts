import { BadRequestException } from '@nestjs/common';
import { dtoValidator } from 'src/shared/validators/dto-validator';
import { ParamsDto } from './params.dto';

describe('ParamsDto', () => {
  describe('id field', () => {
    it('should throw an error when not providing any id', async() => {
      // Arrange
      const data = { };

      // Act & Assert
      expect.assertions(2);
      return dtoValidator(ParamsDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('id é um campo obrigatório.');
      });
    });

    it('should throw an error when providing null to id', async() => {
      // Arrange
      const data = { id: null };

      // Act & Assert
      expect.assertions(2);
      return dtoValidator(ParamsDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('id é um campo obrigatório.');
      });
    });

    it('should throw an error when providing a number to id', async() => {
      // Arrange
      const data = { id: 10 };

      // Act & Assert
      expect.assertions(2);
      return dtoValidator(ParamsDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('id deve ser do tipo string.');
      });
    });

    it('should throw an error when providing a boolean to id', async() => {
      // Arrange
      const data = { id: true };

      // Act & Assert
      expect.assertions(2);
      return dtoValidator(ParamsDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('id deve ser do tipo string.');
      });
    });

    it('should throw an error when providing an object to id', async() => {
      // Arrange
      const data = { id: {} };

      // Act & Assert
      expect.assertions(2);
      return dtoValidator(ParamsDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('id deve ser do tipo string.');
      });
    });

    it('should throw an error when providing an array to id', async() => {
      // Arrange
      const data = { id: [] };

      // Act & Assert
      expect.assertions(2);
      return dtoValidator(ParamsDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('id deve ser do tipo string.');
      });
    });

    it('should throw an error when providing empty spaces to id', async() => {
      // Arrange
      const data = { id: '    ' };

      // Act & Assert
      expect.assertions(2);
      return dtoValidator(ParamsDto, data).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('id é um campo obrigatório.');
      });
    });

    it('should not throw an error when providing a string to id', async() => {
      // Arrange
      const data = { id: '  string-id   ' };

      // Act
      const result = await dtoValidator(ParamsDto, data);

      // Assert
      expect(result).toBeInstanceOf(ParamsDto);
      expect(result.id).toEqualIgnoringWhitespace(data.id);
    });
  });
});
