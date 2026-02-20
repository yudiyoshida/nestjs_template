import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { TipDto } from '../../dtos/tip.dto';
import type { ITipDao } from '../../persistence/dao/tip-dao.interface';

@Injectable()
export class FindTipById {
  constructor(
    @Inject(TOKENS.TipDao) private readonly tipDao: ITipDao,
  ) {}

  public async execute(id: string): Promise<TipDto | null> {
    return this.tipDao.findById(id);
  }
}
