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
      const data = makeValidInputDto({ title: '  Pouso requer atenção  ' });
      const result = await target.transform(data, metadata);

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
      const data = makeValidInputDto({ content: '  Pista tem buracos  ' });
      const result = await target.transform(data, metadata);

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
      const data = makeValidInputDto({ locationId: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('locationId should not be empty');
      });
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

    it('should accept any string for locationId', async() => {
      const data = makeValidInputDto({ locationId: 'Aeroporto de Congonhas' });
      const result = await target.transform(data, metadata);

      expect(result.locationId).toBe('Aeroporto de Congonhas');
    });

    it('should trim whitespace from locationId', async() => {
      const data = makeValidInputDto({ locationId: '  Santos Dumont  ' });
      const result = await target.transform(data, metadata);

      expect(result.locationId).toBe('Santos Dumont');
    });
  });

  describe('valid data', () => {
    it('should validate successfully with all fields', async() => {
      const data = makeValidInputDto({
        title: 'Pouso requer atenção',
        content: 'Pista principal tem buracos no setor norte.',
        locationId: '123e4567-e89b-12d3-a456-426614174000',
      });

      const result = await target.transform(data, metadata);

      expect(result).toEqual({
        title: 'Pouso requer atenção',
        content: 'Pista principal tem buracos no setor norte.',
        locationId: '123e4567-e89b-12d3-a456-426614174000',
      });
    });
  });
});
