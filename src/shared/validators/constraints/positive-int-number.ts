import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'positive-integer-number', async: false })
export class IsPositiveIntegerNumber implements ValidatorConstraintInterface {
  public validate(input: any) {
    if (typeof input !== 'number' && typeof input !== 'string') {
      return false;
    }

    const value = Number(input);
    if (isNaN(value) || value <= 0 || !Number.isInteger(value)) {
      return false;
    }

    return true;
  }

  public defaultMessage() {
    return '$property deve ser um número inteiro positivo.';
  }
}
