import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidCnpjError extends AppException {
  constructor() {
    super('CNPJ inválido.', HttpStatus.BAD_REQUEST);
    this.name = 'InvalidCnpjError';
  }
}
