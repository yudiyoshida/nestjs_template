import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class FaqNotFoundError extends AppException {
  constructor() {
    super('FAQ não encontrado na base de dados.', HttpStatus.NOT_FOUND);
    this.name = 'FaqNotFoundError';
  }
}
