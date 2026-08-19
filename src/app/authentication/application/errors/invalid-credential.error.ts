import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidCredentialError extends AppException {
  constructor() {
    super('Credenciais inválidas.', HttpStatus.BAD_REQUEST);
    this.name = 'InvalidCredentialError';
  }
}
