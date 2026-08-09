import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class ExternalApiError extends AppException {
  constructor(message: string) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
    this.name = 'ExternalApiError';
  }
}
