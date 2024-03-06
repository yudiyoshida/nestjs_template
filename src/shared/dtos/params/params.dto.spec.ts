import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/config/validation-pipe';
import { Params } from './params.dto';

const metadata: ArgumentMetadata = {
  type: 'param',
  metatype: Params,
};

describe('Params', () => {
  let target!: ValidationPipe;

  beforeAll(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('id field', () => {
    it('should throw an error about required field when not providing any id', async() => {
      const data = { };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('id é um campo obrigatório.');
      });
    });

    it('should throw an error about required field when providing null to id', async() => {
      const data = { id: null };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('id é um campo obrigatório.');
      });
    });

    it('should throw an error about invalid type when providing a number to id', async() => {
      const data = { id: 10 };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('id deve ser do tipo string.');
      });
    });

    it('should throw an error about invalid type when providing a boolean to id', async() => {
      const data = { id: true };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('id deve ser do tipo string.');
      });
    });

    it('should throw an error about invalid type when providing an object to id', async() => {
      const data = { id: {} };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('id deve ser do tipo string.');
      });
    });

    it('should throw an error about invalid type when providing an array to id', async() => {
      const data = { id: [] };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('id deve ser do tipo string.');
      });
    });

    it('should not throw an error when providing a string to id', async() => {
      const data: Params = { id: '   string-id   ' };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(Params);
      expect(result.id).toBe(data.id.trim());
    });
  });
});
