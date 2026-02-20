import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { TipDto } from '../../dtos/tip.dto';
import type { ITipDao } from '../../persistence/dao/tip-dao.interface';
import { FindAllTipQueryDto } from './dtos/find-all-tip-query.dto';

@Injectable()
export class FindAllTip {
  constructor(
    @Inject(TOKENS.TipDao) private readonly tipDao: ITipDao,
  ) {}

  public async execute(query: FindAllTipQueryDto): Promise<IPagination<TipDto>> {
    const [items, total] = await this.tipDao.findAll(query);

    return new Pagination(items, total, query.page, query.size).getDto();
  }
}
