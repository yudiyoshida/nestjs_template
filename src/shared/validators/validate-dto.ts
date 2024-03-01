import { ValidationError, validateSync } from 'class-validator';

export function validateDto(dto: any): ValidationError[] {
  return validateSync(dto);
}

export function getFieldErrors<T>(errors: ValidationError[], field: keyof T): ValidationError | undefined {
  return errors.find(error => error.property === field);
}
