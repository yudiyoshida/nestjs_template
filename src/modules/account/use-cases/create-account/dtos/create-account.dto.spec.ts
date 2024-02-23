import { getFieldErrors, validateDto } from 'src/shared/validators/validate-dto';
import { CreateAccountDto } from './create-account.dto';

describe('CreateAccountDto', () => {
  describe('name field', () => {
    it('should throw an error when not providing any name', () => {
      const dto = new CreateAccountDto();

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'name');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Nome é um campo obrigatório.');
    });

    it('should throw an error when providing null to name', () => {
      const dto = new CreateAccountDto();
      dto.name = null;

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'name');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Nome é um campo obrigatório.');
    });

    it('should throw an error about invalid type when providing a number to name', () => {
      const dto = new CreateAccountDto();
      dto.name = (123 as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'name');

      expect(errors.constraints).toHaveProperty('isString', 'Nome deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing a boolean to name', () => {
      const dto = new CreateAccountDto();
      dto.name = (true as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'name');

      expect(errors.constraints).toHaveProperty('isString', 'Nome deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing an object to name', () => {
      const dto = new CreateAccountDto();
      dto.name = ({} as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'name');

      expect(errors.constraints).toHaveProperty('isString', 'Nome deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing an array to name', () => {
      const dto = new CreateAccountDto();
      dto.name = ([] as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'name');

      expect(errors.constraints).toHaveProperty('isString', 'Nome deve ser do tipo string.');
    });

    it('should not throw an error when providing a string to name', () => {
      const dto = new CreateAccountDto();
      dto.name = 'valid name';

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'name');

      expect(errors?.constraints).toBeUndefined();
    });
  });

  describe('email field', () => {
    it('should throw an error when not providing any email', () => {
      const dto = new CreateAccountDto();

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Email é um campo obrigatório.');
    });

    it('should throw an error when providing null to email', () => {
      const dto = new CreateAccountDto();
      dto.email = null;

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Email é um campo obrigatório.');
    });

    it('should throw an error about invalid type when providing a number to email', () => {
      const dto = new CreateAccountDto();
      dto.email = (123 as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isEmail', 'Email inválido.');
    });

    it('should throw an error about invalid type when providing a boolean to email', () => {
      const dto = new CreateAccountDto();
      dto.email = (true as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isEmail', 'Email inválido.');
    });

    it('should throw an error about invalid type when providing an object to email', () => {
      const dto = new CreateAccountDto();
      dto.email = ({} as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isEmail', 'Email inválido.');
    });

    it('should throw an error about invalid type when providing an array to email', () => {
      const dto = new CreateAccountDto();
      dto.email = ([] as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isEmail', 'Email inválido.');
    });

    it('should throw an error when providing an invalid email', () => {
      const dto = new CreateAccountDto();
      dto.email = 'invalid@@email.com';

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isEmail', 'Email inválido.');
    });

    it('should not throw an error when providing a valid email', () => {
      const dto = new CreateAccountDto();
      dto.email = 'valid@email.com';

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'email');

      expect(errors?.constraints).toBeUndefined();
    });
  });

  describe('password field', () => {
    it('should throw an error when not providing any password', () => {
      const dto = new CreateAccountDto();

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Senha é um campo obrigatório.');
    });

    it('should throw an error when providing null to password', () => {
      const dto = new CreateAccountDto();
      dto.password = null;

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Senha é um campo obrigatório.');
    });

    it('should throw an error about invalid type when providing a number to password', () => {
      const dto = new CreateAccountDto();
      dto.password = (123 as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isString', 'Senha deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing a boolean to password', () => {
      const dto = new CreateAccountDto();
      dto.password = (true as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isString', 'Senha deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing an object to password', () => {
      const dto = new CreateAccountDto();
      dto.password = ({} as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isString', 'Senha deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing an array to password', () => {
      const dto = new CreateAccountDto();
      dto.password = ([] as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isString', 'Senha deve ser do tipo string.');
    });

    it('should throw an error when providing a password with 7 characters', () => {
      const dto = new CreateAccountDto();
      dto.password = '1234567';

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('minLength', 'Senha deve conter, no mínimo, 8 caracteres.');
    });

    it('should not throw an error when providing a password with 8 characters', () => {
      const dto = new CreateAccountDto();
      dto.password = '12345678';

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'password');

      expect(errors?.constraints).toBeUndefined();
    });
  });

  describe('all fields together', () => {
    it('should return no errors', () => {
      const dto = new CreateAccountDto();
      dto.name = 'valid name';
      dto.email = 'valid@emai.com';
      dto.password = '123456789';

      const result = validateDto(dto);

      expect(result).toBeArrayOfSize(0);
    });
  });
});
