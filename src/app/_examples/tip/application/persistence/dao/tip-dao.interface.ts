import { TipDto } from '../../dtos/tip.dto';
import { FindAllTipQueryDto } from '../../usecases/find-all-tip/dtos/find-all-tip-query.dto';

export interface ITipDao {
  findAll(query: FindAllTipQueryDto): Promise<[TipDto[], number]>;
  findById(id: string): Promise<TipDto | null>;
}
