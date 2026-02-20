import { AppException } from 'src/core/filters/app.exception';

export class TipNotFoundError extends AppException {
  constructor(id: string) {
    super(`Dica com id ${id} não encontrada`);
  }
}

export class TipCannotBeEditedError extends AppException {
  constructor() {
    super('Dica não pode ser editada porque está expirada ou removida');
  }
}
