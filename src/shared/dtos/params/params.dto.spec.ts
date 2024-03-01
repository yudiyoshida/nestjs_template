import { getFieldErrors, validateDto } from 'src/shared/validators/validate-dto';
import { Params } from './params.dto';

describe('Params', () => {
  describe('id field', () => {
    it('should not throw an error when providing a string to id', () => {
      const dto = new Params();
      dto.id = 'id-teste';

      const result = validateDto(dto);
      const errors = getFieldErrors<Params>(result, 'id');

      expect(errors?.constraints).toBeUndefined();
    });

    it('should throw an error about required field when not providing a value to id', () => {
      const dto = new Params();

      const result = validateDto(dto);
      const errors = getFieldErrors<Params>(result, 'id');

      expect(errors?.constraints).toHaveProperty('isNotEmpty', 'id é um campo obrigatório.');
    });

    it('should throw an error about required field when providing null to id', () => {
      const dto = new Params();
      dto.id = (null as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<Params>(result, 'id');

      expect(errors?.constraints).toHaveProperty('isNotEmpty', 'id é um campo obrigatório.');
    });

    it('should throw an error about invalid type when providing a number to id', () => {
      const dto = new Params();
      dto.id = (123 as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<Params>(result, 'id');

      expect(errors?.constraints).toHaveProperty('isString', 'id deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing a boolean to id', () => {
      const dto = new Params();
      dto.id = (false as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<Params>(result, 'id');

      expect(errors?.constraints).toHaveProperty('isString', 'id deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing an object to id', () => {
      const dto = new Params();
      dto.id = ({} as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<Params>(result, 'id');

      expect(errors?.constraints).toHaveProperty('isString', 'id deve ser do tipo string.');
    });

    it('should throw an error about invalid type when providing an array to id', () => {
      const dto = new Params();
      dto.id = ([] as unknown as string);

      const result = validateDto(dto);
      const errors = getFieldErrors<Params>(result, 'id');

      expect(errors?.constraints).toHaveProperty('isString', 'id deve ser do tipo string.');
    });
  });
});
