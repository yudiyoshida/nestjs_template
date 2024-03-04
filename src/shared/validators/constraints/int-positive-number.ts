import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'integer-positive-number', async: false })
export class IsPositiveIntegerNumber implements ValidatorConstraintInterface {
  public validate(text: any) {
    if (typeof text !== 'number' && typeof text !== 'string') {
      return false;
    }

    const value = Number(text);
    if (isNaN(value) || value <= 0 || !Number.isInteger(value)) {
      return false;
    }
    return true;
  }

  public defaultMessage() {
    return '$property deve ser um número inteiro positivo.';
  }
}
