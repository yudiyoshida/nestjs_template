import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { TipNotFoundError } from '../../../domain/errors/tip.error';
import type { ITipRepository } from '../../persistence/repository/tip-repository.interface';
import { EditTipInputDto } from './dtos/edit-tip.dto';

@Injectable()
export class EditTip {
  constructor(
    @Inject(TOKENS.TipRepository) private readonly tipRepository: ITipRepository,
  ) {}

  public async execute(id: string, data: EditTipInputDto, accountId?: string): Promise<SuccessMessage> {
    const tip = await this.tipRepository.findById(id);
    if (!tip) {
      throw new TipNotFoundError(id);
    }
    if (accountId && tip.props.createdBy !== accountId) {
      throw new TipNotFoundError(id);
    }

    tip.update(data);
    await this.tipRepository.edit(tip);

    return { message: 'Dica atualizada com sucesso' };
  }
}
