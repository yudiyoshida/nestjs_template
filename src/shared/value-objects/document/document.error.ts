import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidDocumentError extends AppException {
  constructor() {
    super('CPF/CNPJ inválido.', HttpStatus.BAD_REQUEST);
    this.name = 'InvalidDocumentError';
  }
}
