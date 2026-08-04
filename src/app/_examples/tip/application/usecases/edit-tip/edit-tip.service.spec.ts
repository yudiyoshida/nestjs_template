import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { TipStatus } from '../../../domain/enums/tip-status.enum';
import { TipType } from '../../../domain/enums/tip-type.enum';
import { TipCannotBeEditedError } from '../../../domain/errors/tip-cannot-be-edited.error';
import { TipNotFoundError } from '../../../domain/errors/tip-not-found.error';
import { TipFactory } from '../../../domain/factories/tip.factory';
import type { ITipRepository } from '../../persistence/repository/tip-repository.interface';
import { EditTipInputDto } from './dtos/edit-tip.dto';
import { EditTip } from './edit-tip.service';

function makeTip(overrides: Partial<Parameters<typeof TipFactory.load>[0]> = {}) {
  return TipFactory.load({
    id: 'tip-id',
    title: 'Ventos fortes hoje',
    content: 'Rajadas de vento podem chegar a 60 km/h.',
    locationId: null,
    createdBy: 'admin-user',
    type: TipType.WEATHER,
    status: TipStatus.ACTIVE,
    expiresAt: null,
    ...overrides,
  });
}

describe('EditTip - Unit tests', () => {
  let sut: EditTip;
  let tipRepository: ITipRepository;

  beforeEach(async() => {
    tipRepository = createMock<ITipRepository>();

    const module = await Test.createTestingModule({
      providers: [
        EditTip,
        { provide: TOKENS.TipRepository, useValue: tipRepository },
      ],
    }).compile();

    sut = module.get(EditTip);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should throw TipNotFoundError when the tip does not exist', async() => {
    // Arrange
    jest.spyOn(tipRepository, 'findById').mockResolvedValue(null);
    const data: EditTipInputDto = { title: 'Novo título' };

    // Act & Assert
    expect.assertions(1);
    return sut.execute('missing-id', data).catch((error) => {
      expect(error).toBeInstanceOf(TipNotFoundError);
    });
  });

  it('should throw TipNotFoundError when the given accountId does not own the tip', async() => {
    // Arrange
    const tip = makeTip({ createdBy: 'other-user' });
    jest.spyOn(tipRepository, 'findById').mockResolvedValue(tip);
    const data: EditTipInputDto = { title: 'Novo título' };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(tip.props.id, data, 'admin-user').catch((error) => {
      expect(error).toBeInstanceOf(TipNotFoundError);
    });
  });

  it('should throw TipCannotBeEditedError when the tip is expired', async() => {
    // Arrange
    const tip = makeTip({ status: TipStatus.EXPIRED });
    jest.spyOn(tipRepository, 'findById').mockResolvedValue(tip);
    const data: EditTipInputDto = { title: 'Novo título' };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(tip.props.id, data).catch((error) => {
      expect(error).toBeInstanceOf(TipCannotBeEditedError);
    });
  });

  it('should throw TipCannotBeEditedError when the tip is removed', async() => {
    // Arrange
    const tip = makeTip({ status: TipStatus.REMOVED });
    jest.spyOn(tipRepository, 'findById').mockResolvedValue(tip);
    const data: EditTipInputDto = { title: 'Novo título' };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(tip.props.id, data).catch((error) => {
      expect(error).toBeInstanceOf(TipCannotBeEditedError);
    });
  });

  it('should edit the tip and return the success message', async() => {
    // Arrange
    const tip = makeTip();
    jest.spyOn(tipRepository, 'findById').mockResolvedValue(tip);
    const data: EditTipInputDto = { title: 'Novo título' };

    // Act
    const result = await sut.execute(tip.props.id, data);

    // Assert
    expect(tipRepository.edit).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ title: 'Novo título' }) }),
    );
    expect(result).toEqual({ message: 'Dica atualizada com sucesso' });
  });
});
