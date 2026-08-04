import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { TipStatus } from '../../../domain/enums/tip-status.enum';
import { TipType } from '../../../domain/enums/tip-type.enum';
import { TipDto } from '../../dtos/tip.dto';
import type { ITipDao } from '../../persistence/dao/tip-dao.interface';
import { FindTipById } from './find-tip-by-id.service';

function makeTip(overrides: Partial<TipDto> = {}): TipDto {
  return {
    id: 'tip-id',
    type: TipType.WEATHER,
    title: 'Ventos fortes hoje',
    content: 'Rajadas de vento podem chegar a 60 km/h.',
    status: TipStatus.ACTIVE,
    locationId: null,
    createdBy: 'admin-user',
    expiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('FindTipById - Unit tests', () => {
  let sut: FindTipById;
  let tipDao: ITipDao;

  beforeEach(async() => {
    tipDao = createMock<ITipDao>();

    const module = await Test.createTestingModule({
      providers: [
        FindTipById,
        { provide: TOKENS.TipDao, useValue: tipDao },
      ],
    }).compile();

    sut = module.get(FindTipById);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should return the tip when found', async() => {
    // Arrange
    const tip = makeTip();
    jest.spyOn(tipDao, 'findById').mockResolvedValue(tip);

    // Act
    const result = await sut.execute(tip.id);

    // Assert
    expect(tipDao.findById).toHaveBeenCalledWith(tip.id);
    expect(result).toEqual(tip);
  });

  it('should return null when no tip matches the id', async() => {
    // Arrange
    jest.spyOn(tipDao, 'findById').mockResolvedValue(null);

    // Act
    const result = await sut.execute('missing-id');

    // Assert
    expect(result).toBeNull();
  });
});
