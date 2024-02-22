import { getFieldErrors, validateDto } from 'src/shared/validators/validate-dto';
import { CreateAccountDto } from './create-account.dto';

describe('CreateAccountDto', () => {
  const data: CreateAccountDto = {
    name: 'Jhon Doe',
    email: 'jhondoe@email.com',
    password: '123456789',
  };

  describe('name field', () => {
    it('should throw an error when not providing any', async() => {
      const dto = new CreateAccountDto();

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'name');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Nome é um campo obrigatório.');
    });

    it('should throw an error when providing null as name', async() => {
      const dto = new CreateAccountDto();
      dto.name = null;

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'name');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Nome é um campo obrigatório.');
    });

    it('should throw an error about invalid type when providing a numeric name', async() => {
      const dto = new CreateAccountDto();
      dto.name = (123 as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'name');

      expect(errors.constraints).toHaveProperty('isString', 'Nome deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing a boolean name', async() => {
      const dto = new CreateAccountDto();
      dto.name = (true as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'name');

      expect(errors.constraints).toHaveProperty('isString', 'Nome deve ser do tipo string.');
    });
  });

  describe('email field', () => {
    it('should throw an error when not providing any', async() => {
      const dto = new CreateAccountDto();
      dto.name = data.name;

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Email é um campo obrigatório.');
    });

    it('should throw an error when providing null as email', async() => {
      const dto = new CreateAccountDto();
      dto.name = data.name;
      dto.email = null;

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Email é um campo obrigatório.');
    });

    it('should throw an error when providing invalid email', async() => {
      const dto = new CreateAccountDto();
      dto.name = data.name;
      dto.email = 'invalid@@email.com';

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isEmail', 'Email inválido.');
    });
  });

  describe('password field', () => {
    it('should throw an error when not providing any', async() => {
      const dto = new CreateAccountDto();
      dto.name = data.name;
      dto.email = data.email;

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Senha é um campo obrigatório.');
    });

    it('should throw an error when providing null as password', async() => {
      const dto = new CreateAccountDto();
      dto.name = data.name;
      dto.email = data.email;
      dto.password = null;

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Senha é um campo obrigatório.');
    });

    it('should throw an error about invalid type when providing a numeric password', async() => {
      const dto = new CreateAccountDto();
      dto.name = data.name;
      dto.email = data.email;
      dto.password = (123 as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isString', 'Senha deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing a boolean password', async() => {
      const dto = new CreateAccountDto();
      dto.name = data.name;
      dto.email = data.email;
      dto.password = (true as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isString', 'Senha deve ser do tipo string.');
    });

    it('should throw an error when providing a password with 7 characters', async() => {
      const dto = new CreateAccountDto();
      dto.name = data.name;
      dto.email = data.email;
      dto.password = '1234567';

      const result = validateDto(dto);
      const errors = getFieldErrors<CreateAccountDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('minLength', 'Senha deve conter, no mínimo, 8 caracteres.');
    });
  });

  describe('all fields together', () => {
    it('should return no errors', async() => {
      const dto = new CreateAccountDto();
      dto.name = data.name;
      dto.email = data.email;
      dto.password = data.password;

      const result = validateDto(dto);

      expect(result).toHaveLength(0);
    });
  });
});
