import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditTipInputDto } from './edit-tip.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditTipInputDto,
};

function makeValidInputDto(overrides: Partial<EditTipInputDto> = {}): EditTipInputDto {
  return {
    ...overrides,
  };
}

describe('EditTipInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('title field', () => {
    it('should be optional', async() => {
      // Arrange
      const data = makeValidInputDto({ title: undefined });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.title).toBeUndefined();
    });

    it.each([
      '',
      '  ',
    ])('should throw an error if title is empty (%s)', async(value: any) => {
      // Arrange
      const data = makeValidInputDto({ title: value });

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('title é obrigatório');
      });
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if title is not a string (%s)', async(value: any) => {
      // Arrange
      const data = makeValidInputDto({ title: value });

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('title deve ser uma string');
      });
    });

    it('should throw an error if title exceeds 256 characters', async() => {
      // Arrange
      const data = makeValidInputDto({ title: 'a'.repeat(257) });

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('title deve ter no máximo 256 caracteres');
      });
    });

    it('should trim whitespace from title', async() => {
      // Arrange
      const data = makeValidInputDto({ title: '  Ventos fortes  ' });
      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.title).toBe('Ventos fortes');
    });

    it('should accept valid title', async() => {
      // Arrange
      const data = makeValidInputDto({ title: 'Ventos fortes hoje' });
      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.title).toBe('Ventos fortes hoje');
    });
  });

  describe('content field', () => {
    it('should be optional', async() => {
      // Arrange
      const data = makeValidInputDto({ content: undefined });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.content).toBeUndefined();
    });

    it.each([
      '',
      '  ',
    ])('should throw an error if content is empty (%s)', async(value: any) => {
      // Arrange
      const data = makeValidInputDto({ content: value });

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('content é obrigatório');
      });
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if content is not a string (%s)', async(value: any) => {
      // Arrange
      const data = makeValidInputDto({ content: value });

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('content deve ser uma string');
      });
    });

    it('should trim whitespace from content', async() => {
      // Arrange
      const data = makeValidInputDto({ content: '  Rajadas de vento  ' });
      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.content).toBe('Rajadas de vento');
    });

    it('should accept valid content', async() => {
      // Arrange
      const data = makeValidInputDto({ content: 'Rajadas de vento podem chegar a 70 km/h.' });
      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.content).toBe('Rajadas de vento podem chegar a 70 km/h.');
    });
  });

  describe('all fields validation', () => {
    it('should pass with empty body', async() => {
      // Arrange
      const data = makeValidInputDto({});

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditTipInputDto);
    });

    it('should pass with all fields', async() => {
      // Arrange
      const data = makeValidInputDto({
        title: 'Ventos fortes hoje',
        content: 'Rajadas de vento podem chegar a 70 km/h.',
      });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.title).toBe('Ventos fortes hoje');
      expect(result.content).toBe('Rajadas de vento podem chegar a 70 km/h.');
    });

    it('should pass with only title', async() => {
      // Arrange
      const data = makeValidInputDto({
        title: 'Novo título',
      });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.title).toBe('Novo título');
      expect(result.content).toBeUndefined();
    });

    it('should pass with only content', async() => {
      // Arrange
      const data = makeValidInputDto({
        content: 'Novo conteúdo',
      });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.title).toBeUndefined();
      expect(result.content).toBe('Novo conteúdo');
    });
  });
});
