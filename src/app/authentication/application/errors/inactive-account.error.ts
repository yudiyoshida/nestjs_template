import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InactiveAccountError extends AppException {
  constructor() {
    super('A sua conta foi suspensa. Entre em contato com a administração para mais detalhes.', HttpStatus.FORBIDDEN);
    this.name = 'InactiveAccountError';
  }
}
