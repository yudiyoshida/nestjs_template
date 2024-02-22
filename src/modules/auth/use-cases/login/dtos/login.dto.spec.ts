import { getFieldErrors, validateDto } from 'src/shared/validators/validate-dto';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  const data: LoginDto = {
    email: 'jhondoe@email',
    password: '123456789',
  };

  describe('email field', () => {
    it('should throw an error when not providing any', async() => {
      const dto = new LoginDto();

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Email é um campo obrigatório.');
    });

    it('should throw an error when providing null as email', async() => {
      const dto = new LoginDto();
      dto.email = null;

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Email é um campo obrigatório.');
    });

    it('should throw an error about invalid type when providing a numeric email', async() => {
      const dto = new LoginDto();
      dto.email = (123 as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isString', 'Email deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing a boolean email', async() => {
      const dto = new LoginDto();
      dto.email = (true as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'email');

      expect(errors.constraints).toHaveProperty('isString', 'Email deve ser do tipo string.');
    });
  });

  describe('password field', () => {
    it('should throw an error when not providing any', async() => {
      const dto = new LoginDto();
      dto.email = data.email;

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Senha é um campo obrigatório.');
    });

    it('should throw an error when providing null as password', async() => {
      const dto = new LoginDto();
      dto.email = data.email;
      dto.password = null;

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isNotEmpty', 'Senha é um campo obrigatório.');
    });

    it('should throw an error about invalid type when providing a numeric password', async() => {
      const dto = new LoginDto();
      dto.email = data.email;
      dto.password = (123 as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isString', 'Senha deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing a boolean password', async() => {
      const dto = new LoginDto();
      dto.email = data.email;
      dto.password = (true as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'password');

      expect(errors.constraints).toHaveProperty('isString', 'Senha deve ser do tipo string.');
    });
  });

  describe('all fields together', () => {
    it('should return no errors', async() => {
      const dto = new LoginDto();
      dto.email = data.email;
      dto.password = data.password;

      const result = validateDto(dto);

      expect(result).toHaveLength(0);
    });
  });
});
