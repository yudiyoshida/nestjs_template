import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidPhoneError extends AppException {
  constructor() {
    super('Telefone inválido.', HttpStatus.BAD_REQUEST);
    this.name = 'InvalidPhoneError';
  }
}
