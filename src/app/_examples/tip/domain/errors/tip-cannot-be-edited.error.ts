import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class TipCannotBeEditedError extends AppException {
  constructor() {
    super('Dica não pode ser editada porque está expirada ou removida.', HttpStatus.UNPROCESSABLE_ENTITY);
    this.name = 'TipCannotBeEditedError';
  }
}
