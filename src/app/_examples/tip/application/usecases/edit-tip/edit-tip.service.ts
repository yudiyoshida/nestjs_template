import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { TipCannotBeEditedError } from '../../../domain/errors/tip-cannot-be-edited.error';
import { TipNotFoundError } from '../../../domain/errors/tip-not-found.error';
import { TipFactory } from '../../../domain/factories/tip.factory';
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
    if (!tip.canBeEdited()) {
      throw new TipCannotBeEditedError();
    }

    const editedTip = TipFactory.edit(tip, data);

    await this.tipRepository.edit(editedTip);

    return { message: 'Dica atualizada com sucesso' };
  }
}
