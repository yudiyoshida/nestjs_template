import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidDocumentError extends AppException {
  constructor(document: string) {
    super(`CPF/CNPJ inválido: ${document}.`, HttpStatus.BAD_REQUEST);
    this.name = 'InvalidDocumentError';
  }
}
