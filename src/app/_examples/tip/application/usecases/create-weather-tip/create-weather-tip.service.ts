import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { Tip } from '../../../domain/entities/tip.entity';
import type { ITipRepository } from '../../persistence/repository/tip-repository.interface';
import { CreateWeatherTipInputDto, CreateWeatherTipOutputDto } from './dtos/create-weather-tip.dto';

@Injectable()
export class CreateWeatherTip {
  constructor(
    @Inject(TOKENS.TipRepository) private readonly tipRepository: ITipRepository,
  ) {}

  public async execute(data: CreateWeatherTipInputDto, createdBy: string): Promise<CreateWeatherTipOutputDto> {
    const tip = Tip.createWeather({
      title: data.title,
      content: data.content,
      locationId: data.locationId ?? null,
      createdBy,
    });

    await this.tipRepository.save(tip);

    return {
      id: tip.props.id,
      expiresAt: tip.props.expiresAt!,
    };
  }
}
