import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { TipNotFoundError } from '../../../domain/errors/tip-not-found.error';
import { TipFactory } from '../../../domain/factories/tip.factory';
import type { ITipDao } from '../../persistence/dao/tip-dao.interface';
import type { ITipRepository } from '../../persistence/repository/tip-repository.interface';
import { EditTipInputDto } from './dtos/edit-tip.dto';

@Injectable()
export class EditTip {
  constructor(
    @Inject(TOKENS.TipDao) private readonly tipDao: ITipDao,
    @Inject(TOKENS.TipRepository) private readonly tipRepository: ITipRepository,
  ) {}

  public async execute(id: string, data: EditTipInputDto, accountId?: string): Promise<SuccessMessage> {
    const tip = await this.tipDao.findById(id);
    if (!tip) {
      throw new TipNotFoundError(id);
    }
    if (accountId && tip.createdBy !== accountId) {
      throw new TipNotFoundError(id);
    }

    const tipEntity = TipFactory.load({
      ...tip,
      ...data,
    });

    await this.tipRepository.edit(tipEntity);

    return { message: 'Dica atualizada com sucesso' };
  }
}
