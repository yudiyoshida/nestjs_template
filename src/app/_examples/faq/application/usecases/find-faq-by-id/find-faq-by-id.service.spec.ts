import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { FaqNotFoundError } from '../../../domain/errors/faq-not-found.error';
import { FaqDto } from '../../dtos/faq.dto';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { FindFaqById } from './find-faq-by-id.service';

function makeFaq(overrides: Partial<FaqDto> = {}): FaqDto {
  return {
    id: 'faq-id',
    question: 'Como faço para recuperar minha senha?',
    answer: 'Clique em "Esqueci minha senha" na tela de login.',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('FindFaqById - Unit tests', () => {
  let sut: FindFaqById;
  let faqDao: IFaqDao;

  beforeEach(async() => {
    faqDao = createMock<IFaqDao>();

    const module = await Test.createTestingModule({
      providers: [
        FindFaqById,
        { provide: TOKENS.FaqDao, useValue: faqDao },
      ],
    }).compile();

    sut = module.get(FindFaqById);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should return the faq when found', async() => {
    // Arrange
    const faq = makeFaq();
    jest.spyOn(faqDao, 'findById').mockResolvedValue(faq);

    // Act
    const result = await sut.execute(faq.id);

    // Assert
    expect(result).toEqual(faq);
  });

  it('should throw FaqNotFoundError when the faq does not exist', async() => {
    // Arrange
    jest.spyOn(faqDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    expect.assertions(1);
    return sut.execute('missing-id').catch((error) => {
      expect(error).toBeInstanceOf(FaqNotFoundError);
    });
  });
});
