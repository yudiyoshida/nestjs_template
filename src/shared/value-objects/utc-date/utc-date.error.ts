import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidDateError extends AppException {
  constructor() {
    super('Data inválida.', HttpStatus.BAD_REQUEST);
    this.name = 'InvalidDateError';
  }
}

export class InvalidDaysQuantityError extends AppException {
  constructor() {
    super('Quantidade de dias inválida.', HttpStatus.BAD_REQUEST);
    this.name = 'InvalidDaysQuantityError';
  }
}

export class InvalidMonthsQuantityError extends AppException {
  constructor() {
    super('Quantidade de meses inválida.', HttpStatus.BAD_REQUEST);
    this.name = 'InvalidMonthsQuantityError';
  }
}
