import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { ITipRepository } from '../../persistence/repository/tip-repository.interface';
import { CreateLocalTip } from './create-local-tip.service';
import { CreateLocalTipInputDto } from './dtos/create-local-tip.dto';

function makeInput(overrides: Partial<CreateLocalTipInputDto> = {}): CreateLocalTipInputDto {
  return {
    title: 'Pouso requer atenção',
    content: 'Pista principal tem buracos no setor norte.',
    locationId: 'Aeroporto Santos Dumont',
    ...overrides,
  };
}

describe('CreateLocalTip - Unit tests', () => {
  let sut: CreateLocalTip;
  let tipRepository: ITipRepository;

  beforeEach(async() => {
    tipRepository = createMock<ITipRepository>();

    const module = await Test.createTestingModule({
      providers: [
        CreateLocalTip,
        { provide: TOKENS.TipRepository, useValue: tipRepository },
      ],
    }).compile();

    sut = module.get(CreateLocalTip);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should create and save a local tip, returning its id', async() => {
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
          locationId: data.locationId,
          createdBy: 'admin-user',
        }),
      }),
    );
    expect(result.id).toEqual(expect.any(String));
  });
});
