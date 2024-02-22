import { ValidationError } from '@nestjs/common';
import { validateSync } from 'class-validator';

export function validateDto(dto: any): ValidationError[] {
  return validateSync(dto);
}

export function getFieldErrors<T>(errors: ValidationError[], field: keyof T): ValidationError {
  return errors.find(error => error.property === field);
}
