import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class TipCannotBeRemovedError extends AppException {
  constructor() {
    super('Dica não pode ser removida porque não está ativa.', HttpStatus.UNPROCESSABLE_ENTITY);
    this.name = 'TipCannotBeRemovedError';
  }
}
