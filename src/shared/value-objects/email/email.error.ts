import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidEmailError extends AppException {
  constructor() {
    super('E-mail inválido.', HttpStatus.BAD_REQUEST);
    this.name = 'InvalidEmailError';
  }
}
