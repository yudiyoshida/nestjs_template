import { AppException } from 'src/core/filters/app.exception';

export class TipCannotBeExpiredError extends AppException {
  constructor() {
    super('Dica não pode expirar porque não está ativa');
  }
}
