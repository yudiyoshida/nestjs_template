import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class TipCannotBeExpiredError extends AppException {
  constructor() {
    super('Dica não pode expirar porque não está ativa.', HttpStatus.UNPROCESSABLE_ENTITY);
    this.name = 'TipCannotBeExpiredError';
  }
}
