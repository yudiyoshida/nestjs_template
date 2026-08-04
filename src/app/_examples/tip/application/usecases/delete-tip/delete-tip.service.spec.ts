import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { TipStatus } from '../../../domain/enums/tip-status.enum';
import { TipType } from '../../../domain/enums/tip-type.enum';
import { TipNotFoundError } from '../../../domain/errors/tip-not-found.error';
import { TipFactory } from '../../../domain/factories/tip.factory';
import type { ITipRepository } from '../../persistence/repository/tip-repository.interface';
import { DeleteTip } from './delete-tip.service';

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

describe('DeleteTip - Unit tests', () => {
  let sut: DeleteTip;
  let tipRepository: ITipRepository;

  beforeEach(async() => {
    tipRepository = createMock<ITipRepository>();

    const module = await Test.createTestingModule({
      providers: [
        DeleteTip,
        { provide: TOKENS.TipRepository, useValue: tipRepository },
      ],
    }).compile();

    sut = module.get(DeleteTip);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should throw TipNotFoundError when the tip does not exist', async() => {
    // Arrange
    jest.spyOn(tipRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    expect.assertions(1);
    return sut.execute('missing-id').catch((error) => {
      expect(error).toBeInstanceOf(TipNotFoundError);
    });
  });

  it('should throw TipNotFoundError when a creatorId is given and does not own the tip', async() => {
    // Arrange
    const tip = makeTip({ createdBy: 'other-user' });
    jest.spyOn(tipRepository, 'findById').mockResolvedValue(tip);

    // Act & Assert
    expect.assertions(1);
    return sut.execute(tip.props.id, 'admin-user').catch((error) => {
      expect(error).toBeInstanceOf(TipNotFoundError);
    });
  });

  it('should delete the tip and return the success message', async() => {
    // Arrange
    const tip = makeTip();
    jest.spyOn(tipRepository, 'findById').mockResolvedValue(tip);

    // Act
    const result = await sut.execute(tip.props.id);

    // Assert
    expect(tipRepository.delete).toHaveBeenCalledWith(tip.props.id);
    expect(result).toEqual({ message: 'Dica excluída com sucesso' });
  });

  it('should delete the tip when the given creatorId owns it', async() => {
    // Arrange
    const tip = makeTip({ createdBy: 'admin-user' });
    jest.spyOn(tipRepository, 'findById').mockResolvedValue(tip);

    // Act
    const result = await sut.execute(tip.props.id, 'admin-user');

    // Assert
    expect(tipRepository.delete).toHaveBeenCalledWith(tip.props.id);
    expect(result).toEqual({ message: 'Dica excluída com sucesso' });
  });
});
