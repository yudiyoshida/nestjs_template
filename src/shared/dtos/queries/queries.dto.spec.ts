import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/config/validation-pipe';
import { Queries } from './queries.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: Queries,
};

describe('Queries', () => {
  let target!: ValidationPipe;

  beforeAll(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('page field', () => {
    it('should throw an error when providing a string to page', async() => {
      const data = { page: 'abc' };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número inteiro positivo.');
      });
    });

    it('should throw an error when providing a boolean to page', async() => {
      const data = { page: true };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número inteiro positivo.');
      });
    });

    it('should throw an error when providing an object to page', async() => {
      const data = { page: {} };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número inteiro positivo.');
      });
    });

    it('should throw an error when providing an array to page', async() => {
      const data = { page: [] };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número inteiro positivo.');
      });
    });

    it('should throw an error when providing a decimal number to page', async() => {
      const data = { page: 1.4 };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número inteiro positivo.');
      });
    });

    it('should throw an error when providing zero to page', async() => {
      const data = { page: 0 };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número inteiro positivo.');
      });
    });

    it('should throw an error when providing negative number to page', async() => {
      const data = { page: -1 };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('page deve ser um número inteiro positivo.');
      });
    });

    it('should not throw an error when providing a int number to page (string)', async() => {
      const data = { size: 'abc', page: '3' };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).not.toEqual(expect.arrayContaining([expect.stringMatching(/page/)]));
      });
    });

    it('should not throw an error when providing a int number to page (number)', async() => {
      const data = { size: 'abc', page: 3 };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).not.toEqual(expect.arrayContaining([expect.stringMatching(/page/)]));
      });
    });

    it('should not throw an error when not providing any page', async() => {
      const data = { size: 'abc' };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).not.toEqual(expect.arrayContaining([expect.stringMatching(/page/)]));
      });
    });

    it('should not throw an error when providing null to page', async() => {
      const data = { size: 'abc', page: null };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).not.toEqual(expect.arrayContaining([expect.stringMatching(/page/)]));
      });
    });
  });

  describe('size field', () => {
    it('should throw an error when providing a string to size', async() => {
      const data = { size: 'abc' };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número inteiro positivo.');
      });
    });

    it('should throw an error when providing a boolean to size', async() => {
      const data = { size: true };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número inteiro positivo.');
      });
    });

    it('should throw an error when providing an object to size', async() => {
      const data = { size: {} };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número inteiro positivo.');
      });
    });

    it('should throw an error when providing an array to size', async() => {
      const data = { size: [] };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número inteiro positivo.');
      });
    });

    it('should throw an error when providing a decimal number to size', async() => {
      const data = { size: 10.89 };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número inteiro positivo.');
      });
    });

    it('should throw an error when providing zero to size', async() => {
      const data = { size: 0 };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número inteiro positivo.');
      });
    });

    it('should throw an error when providing negative number to size', async() => {
      const data = { size: -1 };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('size deve ser um número inteiro positivo.');
      });
    });

    it('should not throw an error when providing a int number to size (string)', async() => {
      const data = { page: 'abc', size: '3' };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).not.toEqual(expect.arrayContaining([expect.stringMatching(/size/)]));
      });
    });

    it('should not throw an error when providing a int number to size (number)', async() => {
      const data = { page: 'abc', size: 3 };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).not.toEqual(expect.arrayContaining([expect.stringMatching(/size/)]));
      });
    });

    it('should not throw an error when not providing any size', async() => {
      const data = { page: 'abc' };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).not.toEqual(expect.arrayContaining([expect.stringMatching(/size/)]));
      });
    });

    it('should not throw an error when providing null to size', async() => {
      const data = { page: 'abc', size: null };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).not.toEqual(expect.arrayContaining([expect.stringMatching(/size/)]));
      });
    });
  });

  describe('all fields together', () => {
    it('should pass all tests', async() => {
      const data = { page: '4002', size: '8922' };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(Queries);
      expect(result.page).toBe(+data.page);
      expect(result.size).toBe(+data.size);
    });
  });
});
