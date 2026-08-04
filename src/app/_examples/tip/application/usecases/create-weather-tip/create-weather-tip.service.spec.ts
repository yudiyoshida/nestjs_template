import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { ITipRepository } from '../../persistence/repository/tip-repository.interface';
import { CreateWeatherTip } from './create-weather-tip.service';
import { CreateWeatherTipInputDto } from './dtos/create-weather-tip.dto';

function makeInput(overrides: Partial<CreateWeatherTipInputDto> = {}): CreateWeatherTipInputDto {
  return {
    title: 'Ventos fortes hoje',
    content: 'Rajadas de vento podem chegar a 60 km/h durante a tarde.',
    ...overrides,
  };
}

describe('CreateWeatherTip - Unit tests', () => {
  let sut: CreateWeatherTip;
  let tipRepository: ITipRepository;

  beforeEach(async() => {
    tipRepository = createMock<ITipRepository>();

    const module = await Test.createTestingModule({
      providers: [
        CreateWeatherTip,
        { provide: TOKENS.TipRepository, useValue: tipRepository },
      ],
    }).compile();

    sut = module.get(CreateWeatherTip);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should create and save a weather tip, returning its id and expiration date', async() => {
    // Arrange
    const data = makeInput();

    // Act
    const result = await sut.execute(data, 'admin-user');

    // Assert
    expect(tipRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          title: data.title,
          content: data.content,
          locationId: null,
          createdBy: 'admin-user',
        }),
      }),
    );
    expect(result.id).toEqual(expect.any(String));
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('should use the provided locationId when informed', async() => {
    // Arrange
    const data = makeInput({ locationId: 'São Paulo' });

    // Act
    await sut.execute(data, 'admin-user');

    // Assert
    expect(tipRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({ locationId: 'São Paulo' }),
      }),
    );
  });
});
