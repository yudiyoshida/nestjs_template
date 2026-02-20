import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { TipNotFoundError } from '../../../domain/errors/tip.error';
import type { ITipRepository } from '../../persistence/repository/tip-repository.interface';

@Injectable()
export class DeleteTip {
  constructor(
    @Inject(TOKENS.TipRepository) private readonly tipRepository: ITipRepository,
  ) {}

  // user controller informa creatorId, enquanto que admin controller não precisa.
  // user só pode deletar suas proprias dicas, admin pode deletar qualquer uma.
  public async execute(id: string, creatorId?: string): Promise<SuccessMessage> {
    const tip = await this.tipRepository.findById(id);
    if (!tip) {
      throw new TipNotFoundError(id);
    }
    if (creatorId && tip.props.createdBy !== creatorId) {
      throw new TipNotFoundError(id);
    }

    await this.tipRepository.delete(id);

    return { message: 'Dica excluída com sucesso' };
  }
}
