import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidZipCodeError extends AppException {
  constructor(zipCode: string) {
    super(`CEP inválido: ${zipCode}.`, HttpStatus.BAD_REQUEST);
    this.name = 'InvalidZipCodeError';
  }
}
