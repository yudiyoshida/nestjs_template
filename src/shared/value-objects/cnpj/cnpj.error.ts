import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidCnpjError extends AppException {
  constructor(cnpj: string) {
    super(`CNPJ inválido: ${cnpj}.`, HttpStatus.BAD_REQUEST);
    this.name = 'InvalidCnpjError';
  }
}
