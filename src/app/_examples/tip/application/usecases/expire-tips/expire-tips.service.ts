import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { TipStatus } from '../../../domain/enums/tip-status.enum';
import { TipType } from '../../../domain/enums/tip-type.enum';
import type { ITipDao } from '../../persistence/dao/tip-dao.interface';
import type { ITipRepository } from '../../persistence/repository/tip-repository.interface';

@Injectable()
export class ExpireTips {
  constructor(
    @Inject(TOKENS.TipRepository) private readonly tipRepository: ITipRepository,
    @Inject(TOKENS.TipDao) private readonly tipDao: ITipDao,
  ) {}

  public async execute(): Promise<void> {
    // Buscar tips weather ativas
    const [weatherTips] = await this.tipDao.findAll({
      type: TipType.WEATHER,
      status: TipStatus.ACTIVE,
    });

    for (const tipDto of weatherTips) {
      const tip = await this.tipRepository.findById(tipDto.id);
      if (tip && tip.hasExpired() && tip.isActive()) {
        tip.expire();
        await this.tipRepository.edit(tip);
      }
    }
  }
}
