import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidRefreshTokenError extends AppException {
  constructor() {
    super('Token de atualização inválido ou expirado.', HttpStatus.UNAUTHORIZED);
    this.name = 'InvalidRefreshTokenError';
  }
}
