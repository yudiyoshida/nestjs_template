import { AppException } from 'src/core/filters/app.exception';

export class InvalidCnpjError extends AppException {
  constructor() {
    super('CNPJ inválido');
    this.name = 'InvalidCnpjError';
  }
}
