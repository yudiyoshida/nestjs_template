import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidPasswordError extends AppException {
  constructor() {
    super('Senha inválida.', HttpStatus.BAD_REQUEST);
    this.name = 'InvalidPasswordError';
  }
}
