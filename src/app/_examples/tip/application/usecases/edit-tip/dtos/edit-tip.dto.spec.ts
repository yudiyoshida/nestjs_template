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
      const data = makeValidInputDto({ title: undefined });

      const result = await target.transform(data, metadata);

      expect(result.title).toBeUndefined();
    });

    it.each([
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

    it('should accept valid title', async() => {
      const data = makeValidInputDto({ title: 'Ventos fortes hoje' });
      const result = await target.transform(data, metadata);

      expect(result.title).toBe('Ventos fortes hoje');
    });
  });

  describe('content field', () => {
    it('should be optional', async() => {
      const data = makeValidInputDto({ content: undefined });

      const result = await target.transform(data, metadata);

      expect(result.content).toBeUndefined();
    });

    it.each([
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

    it('should accept valid content', async() => {
      const data = makeValidInputDto({ content: 'Rajadas de vento podem chegar a 70 km/h.' });
      const result = await target.transform(data, metadata);

      expect(result.content).toBe('Rajadas de vento podem chegar a 70 km/h.');
    });
  });

  describe('all fields validation', () => {
    it('should pass with empty body', async() => {
      const data = makeValidInputDto({});

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(EditTipInputDto);
    });

    it('should pass with all fields', async() => {
      const data = makeValidInputDto({
        title: 'Ventos fortes hoje',
        content: 'Rajadas de vento podem chegar a 70 km/h.',
      });

      const result = await target.transform(data, metadata);

      expect(result.title).toBe('Ventos fortes hoje');
      expect(result.content).toBe('Rajadas de vento podem chegar a 70 km/h.');
    });

    it('should pass with only title', async() => {
      const data = makeValidInputDto({
        title: 'Novo título',
      });

      const result = await target.transform(data, metadata);

      expect(result.title).toBe('Novo título');
      expect(result.content).toBeUndefined();
    });

    it('should pass with only content', async() => {
      const data = makeValidInputDto({
        content: 'Novo conteúdo',
      });

      const result = await target.transform(data, metadata);

      expect(result.title).toBeUndefined();
      expect(result.content).toBe('Novo conteúdo');
    });
  });
});
