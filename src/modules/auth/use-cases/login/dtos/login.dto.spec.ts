import { getFieldErrors, validateDto } from 'src/shared/validators/validate-dto';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  describe('email field', () => {
    it('should throw an error when not providing any email', () => {
      const dto = new LoginDto();

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'email');

      expect(errors?.constraints).toHaveProperty('isNotEmpty', 'Email é um campo obrigatório.');
    });

    it('should throw an error when providing null to email', () => {
      const dto = new LoginDto();
      dto.email = (null as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'email');

      expect(errors?.constraints).toHaveProperty('isNotEmpty', 'Email é um campo obrigatório.');
    });

    it('should throw an error about invalid type when providing a number to email', () => {
      const dto = new LoginDto();
      dto.email = (123 as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'email');

      expect(errors?.constraints).toHaveProperty('isString', 'Email deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing a boolean to email', () => {
      const dto = new LoginDto();
      dto.email = (true as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'email');

      expect(errors?.constraints).toHaveProperty('isString', 'Email deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing an object to email', () => {
      const dto = new LoginDto();
      dto.email = ({} as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'email');

      expect(errors?.constraints).toHaveProperty('isString', 'Email deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing an array to email', () => {
      const dto = new LoginDto();
      dto.email = ([] as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'email');

      expect(errors?.constraints).toHaveProperty('isString', 'Email deve ser do tipo string.');
    });

    it('should not throw an error when providing a string to email', () => {
      const dto = new LoginDto();
      dto.email = 'string';

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'email');

      expect(errors?.constraints).toBeUndefined();
    });
  });

  describe('password field', () => {
    it('should throw an error when not providing any password', () => {
      const dto = new LoginDto();

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'password');

      expect(errors?.constraints).toHaveProperty('isNotEmpty', 'Senha é um campo obrigatório.');
    });

    it('should throw an error when providing null to password', () => {
      const dto = new LoginDto();
      dto.password = (null as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'password');

      expect(errors?.constraints).toHaveProperty('isNotEmpty', 'Senha é um campo obrigatório.');
    });

    it('should throw an error about invalid type when providing a number to password', () => {
      const dto = new LoginDto();
      dto.password = (123 as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'password');

      expect(errors?.constraints).toHaveProperty('isString', 'Senha deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing a boolean to password', () => {
      const dto = new LoginDto();
      dto.password = (true as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'password');

      expect(errors?.constraints).toHaveProperty('isString', 'Senha deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing an object to password', () => {
      const dto = new LoginDto();
      dto.password = ({} as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'password');

      expect(errors?.constraints).toHaveProperty('isString', 'Senha deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing an array to password', () => {
      const dto = new LoginDto();
      dto.password = ([] as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'password');

      expect(errors?.constraints).toHaveProperty('isString', 'Senha deve ser do tipo string.');
    });

    it('should not throw an error when providing a string to password', () => {
      const dto = new LoginDto();
      dto.password = 'string';

      const result = validateDto(dto);
      const errors = getFieldErrors<LoginDto>(result, 'password');

      expect(errors?.constraints).toBeUndefined();
    });
  });

  describe('all fields together', () => {
    it('should return no errors', () => {
      const dto = new LoginDto();
      dto.email = 'jhondoe@email.com';
      dto.password = '123456789';

      const result = validateDto(dto);

      expect(result).toBeArrayOfSize(0);
    });
  });
});
