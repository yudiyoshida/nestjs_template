import { Tip } from 'src/app/_examples/tip/domain/entities/tip.entity';

export interface ITipRepository {
  save(tip: Tip): Promise<void>;
  edit(tip: Tip): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string, ): Promise<Tip | null>;
}
