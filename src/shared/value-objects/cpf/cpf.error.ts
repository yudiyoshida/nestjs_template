import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidCpfError extends AppException {
  constructor(cpf: string) {
    super(`CPF inválido: ${cpf}.`, HttpStatus.BAD_REQUEST);
    this.name = 'InvalidCpfError';
  }
}
