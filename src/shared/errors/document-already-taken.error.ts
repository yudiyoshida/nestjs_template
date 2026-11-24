import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class DocumentAlreadyTakenError extends AppException {
  constructor() {
    super('O documento informado já está em uso.', HttpStatus.CONFLICT);
    this.name = 'DocumentAlreadyTakenError';
  }
}
