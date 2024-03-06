import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/config/validation-pipe';
import { CreateAccountDto } from './create-account.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  data: '',
  metatype: CreateAccountDto,
};

describe('CreateAccountDto', () => {
  let target!: ValidationPipe;

  beforeAll(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('name field', () => {
    it('should throw an error when not providing any name', async() => {
      const data = { };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo nome é um campo obrigatório.');
      });
    });

    it('should throw an error when providing null to name', async() => {
      const data = { name: null };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo nome é um campo obrigatório.');
      });
    });

    it('should throw an error about invalid type when providing a number to name', async() => {
      const data = { name: 123 };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo nome deve ser do tipo string.');
      });
    });

    it('should throw an error about invalid type when providing a boolean to name', async() => {
      const data = { name: true };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo nome deve ser do tipo string.');
      });
    });

    it('should throw an error about invalid type when providing an object to name', async() => {
      const data = { name: {} };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo nome deve ser do tipo string.');
      });
    });

    it('should throw an error about invalid type when providing an array to name', async() => {
      const data = { name: [] };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo nome deve ser do tipo string.');
      });
    });

    it('should not throw an error when providing a string to name', async() => {
      const data = { name: 'jhon doe' };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).not.toEqual(expect.arrayContaining([expect.stringMatching(/Campo nome/)]));
      });
    });
  });

  describe('email field', () => {
    it('should throw an error when not providing any email', async() => {
      const data = { };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo email é um campo obrigatório.');
      });
    });

    it('should throw an error when providing null to email', async() => {
      const data = { email: null };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo email é um campo obrigatório.');
      });
    });

    it('should throw an error about invalid type when providing a number to email', async() => {
      const data = { email: 123 };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo email inválido.');
      });
    });

    it('should throw an error about invalid type when providing a boolean to email', async() => {
      const data = { email: true };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo email inválido.');
      });
    });

    it('should throw an error about invalid type when providing an object to email', async() => {
      const data = { email: {} };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo email inválido.');
      });
    });

    it('should throw an error about invalid type when providing an array to email', async() => {
      const data = { email: [] };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo email inválido.');
      });
    });

    it('should not throw an error when providing an invalid email', async() => {
      const data = { email: 'invalid@@email.com' };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo email inválido.');
      });
    });

    it('should not throw an error when providing an valid email', async() => {
      const data = { email: 'valid@email.com' };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).not.toEqual(expect.arrayContaining([expect.stringMatching(/Campo email/)]));
      });
    });
  });

  describe('password field', () => {
    it('should throw an error when not providing any password', async() => {
      const data = { };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo senha é um campo obrigatório.');
      });
    });

    it('should throw an error when providing null to password', async() => {
      const data = { password: null };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo senha é um campo obrigatório.');
      });
    });

    it('should throw an error about invalid type when providing a number to password', async() => {
      const data = { password: 123 };

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

    it('should not throw an error when providing an invalid password', async() => {
      const data = { password: '1234567' };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).toContain('Campo senha deve conter, no mínimo, 8 caracteres.');
      });
    });

    it('should not throw an error when providing an valid password', async() => {
      const data = { password: '12345678' };

      expect.assertions(2);
      return target.transform(data, metadata).catch(err => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().message).not.toEqual(expect.arrayContaining([expect.stringMatching(/Campo senha/)]));
      });
    });
  });

  describe('all fields together', () => {
    it('should pass all tests', async() => {
      const data: CreateAccountDto = {
        name: ' Jhon Doe ',
        email: 'jhondoe@email.com  ',
        password: '  123456789',
      };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(CreateAccountDto);
      expect(result.name).toEqualIgnoringWhitespace(data.name);
      expect(result.email).toEqualIgnoringWhitespace(data.email);
      expect(result.password).toEqualIgnoringWhitespace(data.password);
    });
  });
});
