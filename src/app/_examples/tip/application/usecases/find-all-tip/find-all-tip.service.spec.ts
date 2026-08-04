import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { TipStatus } from '../../../domain/enums/tip-status.enum';
import { TipType } from '../../../domain/enums/tip-type.enum';
import { TipDto } from '../../dtos/tip.dto';
import type { ITipDao } from '../../persistence/dao/tip-dao.interface';
import { FindAllTipQueryDto } from './dtos/find-all-tip-query.dto';
import { FindAllTip } from './find-all-tip.service';

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

describe('FindAllTip - Unit tests', () => {
  let sut: FindAllTip;
  let tipDao: ITipDao;

  beforeEach(async() => {
    tipDao = createMock<ITipDao>();

    const module = await Test.createTestingModule({
      providers: [
        FindAllTip,
        { provide: TOKENS.TipDao, useValue: tipDao },
      ],
    }).compile();

    sut = module.get(FindAllTip);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should return a paginated dto built from the dao result', async() => {
    // Arrange
    const tips = [makeTip()];
    jest.spyOn(tipDao, 'findAll').mockResolvedValue([tips, 1]);
    const query: FindAllTipQueryDto = { page: 1, size: 10 };

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(tipDao.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual({
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 1,
      totalPages: 1,
      data: tips,
    });
  });
});
