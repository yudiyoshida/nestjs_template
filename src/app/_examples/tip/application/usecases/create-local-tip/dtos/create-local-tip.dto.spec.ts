import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateLocalTipInputDto } from './create-local-tip.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateLocalTipInputDto,
};

function makeValidInputDto(overrides: Partial<CreateLocalTipInputDto>): CreateLocalTipInputDto {
  return {
    title: 'Pouso requer atenção',
    content: 'Pista principal tem buracos no setor norte.',
    locationId: '123e4567-e89b-12d3-a456-426614174000',
    ...overrides,
  };
}

describe('CreateLocalTipInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('title field', () => {
    it.each([
      undefined,
      null,
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
      const data = makeValidInputDto({ title: '  Pouso requer atenção  ' });
      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.title).toBe('Pouso requer atenção');
    });
  });

  describe('content field', () => {
    it.each([
      undefined,
      null,
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
      const data = makeValidInputDto({ content: '  Pista tem buracos  ' });
      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.content).toBe('Pista tem buracos');
    });
  });

  describe('locationId field', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if locationId is empty (%s)', async(value: any) => {
      // Arrange
      const data = makeValidInputDto({ locationId: value });

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('locationId é obrigatório');
      });
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if locationId is not a string (%s)', async(value: any) => {
      // Arrange
      const data = makeValidInputDto({ locationId: value });

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('locationId deve ser uma string');
      });
    });

    it('should accept any string for locationId', async() => {
      // Arrange
      const data = makeValidInputDto({ locationId: 'Aeroporto de Congonhas' });
      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.locationId).toBe('Aeroporto de Congonhas');
    });

    it('should trim whitespace from locationId', async() => {
      // Arrange
      const data = makeValidInputDto({ locationId: '  Santos Dumont  ' });
      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.locationId).toBe('Santos Dumont');
    });
  });

  describe('valid data', () => {
    it('should validate successfully with all fields', async() => {
      // Arrange
      const data = makeValidInputDto({
        title: 'Pouso requer atenção',
        content: 'Pista principal tem buracos no setor norte.',
        locationId: '123e4567-e89b-12d3-a456-426614174000',
      });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toEqual({
        title: 'Pouso requer atenção',
        content: 'Pista principal tem buracos no setor norte.',
        locationId: '123e4567-e89b-12d3-a456-426614174000',
      });
    });
  });
});
