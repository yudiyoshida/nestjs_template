import { getFieldErrors, validateDto } from 'src/shared/validators/validate-dto';
import { Queries } from './queries.dto';

describe('Queries', () => {
  describe('page field', () => {
    it('should not throw an error when not providing a value to page', () => {
      const dto = new Queries();

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'page');

      expect(errors?.constraints).toBeUndefined();
    });

    it('should not throw an error when providing null to page', () => {
      const dto = new Queries();
      dto.page = null;

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'page');

      expect(errors?.constraints).toBeUndefined();
    });

    it('should not throw an error when providing a positive integer number to page', () => {
      const dto = new Queries();
      dto.page = 10;

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'page');

      expect(errors?.constraints).toBeUndefined();
    });

    it('should throw an error about integer value when providing a text to page', () => {
      const dto = new Queries();
      dto.page = ('12AB' as unknown as number);

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'page');

      expect(errors.constraints).toHaveProperty('isInt', 'page deve ser um número inteiro.');
    });

    it('should throw an error about integer value when providing a boolean to page', () => {
      const dto = new Queries();
      dto.page = (false as unknown as number);

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'page');

      expect(errors.constraints).toHaveProperty('isInt', 'page deve ser um número inteiro.');
    });

    it('should throw an error about integer value when providing an object to page', () => {
      const dto = new Queries();
      dto.page = ({} as unknown as number);

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'page');

      expect(errors.constraints).toHaveProperty('isInt', 'page deve ser um número inteiro.');
    });

    it('should throw an error about integer value when providing an array to page', () => {
      const dto = new Queries();
      dto.page = ([] as unknown as number);

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'page');

      expect(errors.constraints).toHaveProperty('isInt', 'page deve ser um número inteiro.');
    });

    it('should throw an error about integer value when providing a decimal number to page', () => {
      const dto = new Queries();
      dto.page = 1.5;

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'page');

      expect(errors.constraints).toHaveProperty('isInt', 'page deve ser um número inteiro.');
    });

    it('should throw an error about positive value when providing zero to page', () => {
      const dto = new Queries();
      dto.page = 0;

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'page');

      expect(errors.constraints).toHaveProperty('isPositive', 'page deve ser um número positivo.');
    });

    it('should throw an error about positive value when providing negative number to page', () => {
      const dto = new Queries();
      dto.page = -1;

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'page');

      expect(errors.constraints).toHaveProperty('isPositive', 'page deve ser um número positivo.');
    });
  });

  describe('size field', () => {
    it('should not throw an error when not providing a value to size', () => {
      const dto = new Queries();

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'size');

      expect(errors?.constraints).toBeUndefined();
    });

    it('should not throw an error when providing null to size', () => {
      const dto = new Queries();
      dto.size = null;

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'size');

      expect(errors?.constraints).toBeUndefined();
    });

    it('should not throw an error when providing a positive integer number to size', () => {
      const dto = new Queries();
      dto.size = 10;

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'size');

      expect(errors?.constraints).toBeUndefined();
    });

    it('should throw an error about integer value when providing a text to size', () => {
      const dto = new Queries();
      dto.size = ('12AB' as unknown as number);

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'size');

      expect(errors.constraints).toHaveProperty('isInt', 'size deve ser um número inteiro.');
    });

    it('should throw an error about integer value when providing a boolean to size', () => {
      const dto = new Queries();
      dto.size = (false as unknown as number);

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'size');

      expect(errors.constraints).toHaveProperty('isInt', 'size deve ser um número inteiro.');
    });

    it('should throw an error about integer value when providing an object to size', () => {
      const dto = new Queries();
      dto.size = ({} as unknown as number);

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'size');

      expect(errors.constraints).toHaveProperty('isInt', 'size deve ser um número inteiro.');
    });

    it('should throw an error about integer value when providing an array to size', () => {
      const dto = new Queries();
      dto.size = ([] as unknown as number);

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'size');

      expect(errors.constraints).toHaveProperty('isInt', 'size deve ser um número inteiro.');
    });

    it('should throw an error about integer value when providing a decimal number to size', () => {
      const dto = new Queries();
      dto.size = 1.5;

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'size');

      expect(errors.constraints).toHaveProperty('isInt', 'size deve ser um número inteiro.');
    });

    it('should throw an error about positive value when providing zero to size', () => {
      const dto = new Queries();
      dto.size = 0;

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'size');

      expect(errors.constraints).toHaveProperty('isPositive', 'size deve ser um número positivo.');
    });

    it('should throw an error about positive value when providing negative number to size', () => {
      const dto = new Queries();
      dto.size = -1;

      const result = validateDto(dto);
      const errors = getFieldErrors<Queries>(result, 'size');

      expect(errors.constraints).toHaveProperty('isPositive', 'size deve ser um número positivo.');
    });
  });
});
