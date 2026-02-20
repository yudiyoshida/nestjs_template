import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { Tip } from '../../../domain/entities/tip.entity';
import type { ITipRepository } from '../../persistence/repository/tip-repository.interface';
import { CreateLocalTipInputDto, CreateLocalTipOutputDto } from './dtos/create-local-tip.dto';

@Injectable()
export class CreateLocalTip {
  constructor(
    @Inject(TOKENS.TipRepository) private readonly tipRepository: ITipRepository,
  ) {}

  public async execute(data: CreateLocalTipInputDto, createdBy: string): Promise<CreateLocalTipOutputDto> {
    const tip = Tip.createLocal({
      title: data.title,
      content: data.content,
      locationId: data.locationId,
      createdBy,
    });

    await this.tipRepository.save(tip);

    return {
      id: tip.props.id,
    };
  }
}
