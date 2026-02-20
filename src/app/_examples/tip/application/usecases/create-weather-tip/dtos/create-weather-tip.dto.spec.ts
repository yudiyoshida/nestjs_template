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
      const data = makeValidInputDto({ title: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('title should not be empty');
      });
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if title is not a string (%s)', async(value: any) => {
      const data = makeValidInputDto({ title: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('title must be a string');
      });
    });

    it('should throw an error if title exceeds 256 characters', async() => {
      const data = makeValidInputDto({ title: 'a'.repeat(257) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('title must be shorter than or equal to 256 characters');
      });
    });

    it('should trim whitespace from title', async() => {
      const data = makeValidInputDto({ title: '  Ventos fortes  ' });
      const result = await target.transform(data, metadata);

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
      const data = makeValidInputDto({ content: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('content should not be empty');
      });
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if content is not a string (%s)', async(value: any) => {
      const data = makeValidInputDto({ content: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('content must be a string');
      });
    });

    it('should trim whitespace from content', async() => {
      const data = makeValidInputDto({ content: '  Rajadas de vento  ' });
      const result = await target.transform(data, metadata);

      expect(result.content).toBe('Rajadas de vento');
    });
  });

  describe('locationId field', () => {
    it('should accept undefined locationId', async() => {
      const data = makeValidInputDto({ locationId: undefined });
      const result = await target.transform(data, metadata);

      expect(result.locationId).toBeUndefined();
    });

    it('should accept any string for locationId', async() => {
      const data = makeValidInputDto({ locationId: 'Aeroporto de Congonhas' });
      const result = await target.transform(data, metadata);

      expect(result.locationId).toBe('Aeroporto de Congonhas');
    });

    it('should trim whitespace from locationId when provided', async() => {
      const data = makeValidInputDto({ locationId: '  Santos Dumont  ' });
      const result = await target.transform(data, metadata);

      expect(result.locationId).toBe('Santos Dumont');
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if locationId is not a string (%s)', async(value: any) => {
      const data = makeValidInputDto({ locationId: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('locationId must be a string');
      });
    });
  });

  describe('valid data', () => {
    it('should validate successfully with all fields', async() => {
      const data = makeValidInputDto({
        title: 'Ventos fortes hoje',
        content: 'Rajadas de vento podem chegar a 60 km/h durante a tarde.',
        locationId: 'Aeroporto de Congonhas',
      });

      const result = await target.transform(data, metadata);

      expect(result).toEqual({
        title: 'Ventos fortes hoje',
        content: 'Rajadas de vento podem chegar a 60 km/h durante a tarde.',
        locationId: 'Aeroporto de Congonhas',
      });
    });

    it('should validate successfully without optional locationId', async() => {
      const data = makeValidInputDto({
        title: 'Ventos fortes hoje',
        content: 'Rajadas de vento podem chegar a 60 km/h durante a tarde.',
      });

      const result = await target.transform(data, metadata);

      expect(result).toEqual({
        title: 'Ventos fortes hoje',
        content: 'Rajadas de vento podem chegar a 60 km/h durante a tarde.',
        locationId: undefined,
      });
    });
  });
});
