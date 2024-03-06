import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/config/validation-pipe';
import { LoginDto } from './login.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: LoginDto,
};

describe('LoginDto', () => {
  let target!: ValidationPipe;

  beforeAll(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('email field', () => {
    it('should throw an error about required field when not providing any email', async() => {
      const data = { };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo email é um campo obrigatório.');
      });
    });

    it('should throw an error about required field when providing null to email', async() => {
      const data = { email: null };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo email é um campo obrigatório.');
      });
    });

    it('should throw an error about invalid type when providing a number to email', async() => {
      const data = { email: 4002 };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo email deve ser do tipo string.');
      });
    });

    it('should throw an error about invalid type when providing a boolean to email', async() => {
      const data = { email: true };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo email deve ser do tipo string.');
      });
    });

    it('should throw an error about invalid type when providing an object to email', async() => {
      const data = { email: {} };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo email deve ser do tipo string.');
      });
    });

    it('should throw an error about invalid type when providing an array to email', async() => {
      const data = { email: [] };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo email deve ser do tipo string.');
      });
    });

    it('should not throw an error when providing a string to email', async() => {
      const data = { email: 'jhondoe@email.com' };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).not.toEqual(expect.arrayContaining([expect.stringMatching(/email/)]));
      });
    });
  });

  describe('password field', () => {
    it('should throw an error about required field when not providing any password', async() => {
      const data = { };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo senha é um campo obrigatório.');
      });
    });

    it('should throw an error about required field when providing null to password', async() => {
      const data = { password: null };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo senha é um campo obrigatório.');
      });
    });

    it('should throw an error about invalid type when providing a number to password', async() => {
      const data = { password: 4002 };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo senha deve ser do tipo string.');
      });
    });

    it('should throw an error about invalid type when providing a boolean to password', async() => {
      const data = { password: true };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo senha deve ser do tipo string.');
      });
    });

    it('should throw an error about invalid type when providing an object to password', async() => {
      const data = { password: {} };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo senha deve ser do tipo string.');
      });
    });

    it('should throw an error about invalid type when providing an array to password', async() => {
      const data = { password: [] };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo senha deve ser do tipo string.');
      });
    });

    it('should not throw an error when providing a valid password', async() => {
      const data = { password: '12345' };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).not.toEqual(expect.arrayContaining([expect.stringMatching(/senha/)]));
      });
    });
  });

  describe('all fields together', () => {
    it('should pass all tests', async() => {
      const data: LoginDto = { email: '  jhondoe@email.com  ', password: ' 123456789 ' };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(LoginDto);
      expect(result.email).toEqualIgnoringWhitespace(data.email);
      expect(result.password).toEqualIgnoringWhitespace(data.password);
    });
  });
});
