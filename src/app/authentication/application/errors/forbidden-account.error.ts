import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class ForbiddenAccountError extends AppException {
  constructor() {
    super('Acesso negado.', HttpStatus.FORBIDDEN);
    this.name = 'ForbiddenAccountError';
  }
}
