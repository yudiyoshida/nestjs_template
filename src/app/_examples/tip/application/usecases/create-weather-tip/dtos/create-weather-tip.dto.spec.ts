import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateWeatherTipInputDto } from './create-weather-tip.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateWeatherTipInputDto,
};

function makeValidInputDto(overrides: Partial<CreateWeatherTipInputDto>): CreateWeatherTipInputDto {
  return {
    title: 'Ventos fortes hoje',
    content: 'Rajadas de vento podem chegar a 60 km/h durante a tarde.',
    locationId: undefined,
    ...overrides,
  };
}

describe('CreateWeatherTipInputDto', () => {
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
      const data = makeValidInputDto({ title: '  Ventos fortes  ' });
      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.title).toBe('Ventos fortes');
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
      const data = makeValidInputDto({ content: '  Rajadas de vento  ' });
      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.content).toBe('Rajadas de vento');
    });
  });

  describe('locationId field', () => {
    it('should accept undefined locationId', async() => {
      // Arrange
      const data = makeValidInputDto({ locationId: undefined });
      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.locationId).toBeUndefined();
    });

    it('should accept any string for locationId', async() => {
      // Arrange
      const data = makeValidInputDto({ locationId: 'Aeroporto de Congonhas' });
      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.locationId).toBe('Aeroporto de Congonhas');
    });

    it('should trim whitespace from locationId when provided', async() => {
      // Arrange
      const data = makeValidInputDto({ locationId: '  Santos Dumont  ' });
      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.locationId).toBe('Santos Dumont');
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
  });

  describe('valid data', () => {
    it('should validate successfully with all fields', async() => {
      // Arrange
      const data = makeValidInputDto({
        title: 'Ventos fortes hoje',
        content: 'Rajadas de vento podem chegar a 60 km/h durante a tarde.',
        locationId: 'Aeroporto de Congonhas',
      });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toEqual({
        title: 'Ventos fortes hoje',
        content: 'Rajadas de vento podem chegar a 60 km/h durante a tarde.',
        locationId: 'Aeroporto de Congonhas',
      });
    });

    it('should validate successfully without optional locationId', async() => {
      // Arrange
      const data = makeValidInputDto({
        title: 'Ventos fortes hoje',
        content: 'Rajadas de vento podem chegar a 60 km/h durante a tarde.',
      });

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toEqual({
        title: 'Ventos fortes hoje',
        content: 'Rajadas de vento podem chegar a 60 km/h durante a tarde.',
        locationId: undefined,
      });
    });
  });
});
