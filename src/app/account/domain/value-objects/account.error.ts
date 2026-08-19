import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidAccountStatusError extends AppException {
  constructor(status: string) {
    super(`Status inválido - ${status}.`, HttpStatus.BAD_REQUEST);
    this.name = 'InvalidAccountStatusError';
  }
}

export class InvalidAccountRolesError extends AppException {
  constructor(roles: string[]) {
    super(`Roles inválidos - ${roles.join(', ')}.`, HttpStatus.BAD_REQUEST);
    this.name = 'InvalidAccountRolesError';
  }
}
