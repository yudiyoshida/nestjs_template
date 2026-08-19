import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class CacheKeyBuilderError extends AppException {
  constructor(field: string) {
    super(`Não foi possível montar a chave de cache: ${field} é obrigatório.`, HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'CacheKeyBuilderError';
  }
}
