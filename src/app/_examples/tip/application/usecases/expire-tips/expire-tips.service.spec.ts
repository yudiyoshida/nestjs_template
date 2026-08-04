import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { TipStatus } from '../../../domain/enums/tip-status.enum';
import { TipType } from '../../../domain/enums/tip-type.enum';
import { TipFactory } from '../../../domain/factories/tip.factory';
import { TipDto } from '../../dtos/tip.dto';
import type { ITipDao } from '../../persistence/dao/tip-dao.interface';
import type { ITipRepository } from '../../persistence/repository/tip-repository.interface';
import { ExpireTips } from './expire-tips.service';

function makeTipDto(overrides: Partial<TipDto> = {}): TipDto {
  return {
    id: 'tip-id',
    type: TipType.WEATHER,
    title: 'Ventos fortes hoje',
    content: 'Rajadas de vento podem chegar a 60 km/h.',
    status: TipStatus.ACTIVE,
    locationId: null,
    createdBy: 'admin-user',
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeTip(overrides: Partial<Parameters<typeof TipFactory.load>[0]> = {}) {
  return TipFactory.load({
    id: 'tip-id',
    title: 'Ventos fortes hoje',
    content: 'Rajadas de vento podem chegar a 60 km/h.',
    locationId: null,
    createdBy: 'admin-user',
    type: TipType.WEATHER,
    status: TipStatus.ACTIVE,
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    ...overrides,
  });
}

describe('ExpireTips - Unit tests', () => {
  let sut: ExpireTips;
  let tipDao: ITipDao;
  let tipRepository: ITipRepository;

  beforeEach(async() => {
    tipDao = createMock<ITipDao>();
    tipRepository = createMock<ITipRepository>();

    const module = await Test.createTestingModule({
      providers: [
        ExpireTips,
        { provide: TOKENS.TipDao, useValue: tipDao },
        { provide: TOKENS.TipRepository, useValue: tipRepository },
      ],
    }).compile();

    sut = module.get(ExpireTips);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should only query active weather tips', async() => {
    // Arrange
    jest.spyOn(tipDao, 'findAll').mockResolvedValue([[], 0]);

    // Act
    await sut.execute();

    // Assert
    expect(tipDao.findAll).toHaveBeenCalledWith({ type: TipType.WEATHER, status: TipStatus.ACTIVE });
  });

  it('should expire active tips that have already passed their expiration date', async() => {
    // Arrange
    const tipDto = makeTipDto();
    const tip = makeTip();
    jest.spyOn(tipDao, 'findAll').mockResolvedValue([[tipDto], 1]);
    jest.spyOn(tipRepository, 'findById').mockResolvedValue(tip);

    // Act
    await sut.execute();

    // Assert
    expect(tipRepository.edit).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ status: TipStatus.EXPIRED }) }),
    );
  });

  it('should not expire tips that have not passed their expiration date yet', async() => {
    // Arrange
    const tipDto = makeTipDto();
    const tip = makeTip({ expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) });
    jest.spyOn(tipDao, 'findAll').mockResolvedValue([[tipDto], 1]);
    jest.spyOn(tipRepository, 'findById').mockResolvedValue(tip);

    // Act
    await sut.execute();

    // Assert
    expect(tipRepository.edit).not.toHaveBeenCalled();
  });

  it('should skip tips that no longer exist in the repository', async() => {
    // Arrange
    const tipDto = makeTipDto();
    jest.spyOn(tipDao, 'findAll').mockResolvedValue([[tipDto], 1]);
    jest.spyOn(tipRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute()).resolves.not.toThrow();
    expect(tipRepository.edit).not.toHaveBeenCalled();
  });
});
