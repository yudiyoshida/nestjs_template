import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidExpirationTimeError extends AppException {
  constructor() {
    super('Tempo de expiração inválido.', HttpStatus.BAD_REQUEST);
    this.name = 'InvalidExpirationTimeError';
  }
}
