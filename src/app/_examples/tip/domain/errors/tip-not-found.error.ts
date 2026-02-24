import { AppException } from 'src/core/filters/app.exception';

export class TipNotFoundError extends AppException {
  constructor(id: string) {
    super(`Dica com id ${id} não encontrada`);
  }
}
