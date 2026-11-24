import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidCpfError extends AppException {
  constructor() {
    super('CPF inválido.', HttpStatus.BAD_REQUEST);
    this.name = 'InvalidCpfError';
  }
}
