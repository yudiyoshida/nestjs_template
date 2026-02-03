import { AppException } from "src/core/filters/app.exception";

export class InvalidEmailError extends AppException {
  constructor() {
    super('E-mail inválido');
    this.name = 'InvalidEmailError';
  }
}
