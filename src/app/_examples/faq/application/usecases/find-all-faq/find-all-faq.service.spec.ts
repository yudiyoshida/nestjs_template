import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { FaqDto } from '../../dtos/faq.dto';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { FindAllFaqQueryDto } from './dtos/find-all-faq.dto';
import { FindAllFaq } from './find-all-faq.service';

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

describe('FindAllFaq - Unit tests', () => {
  let sut: FindAllFaq;
  let faqDao: IFaqDao;

  beforeEach(async() => {
    faqDao = createMock<IFaqDao>();

    const module = await Test.createTestingModule({
      providers: [
        FindAllFaq,
        { provide: TOKENS.FaqDao, useValue: faqDao },
      ],
    }).compile();

    sut = module.get(FindAllFaq);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should return a paginated dto built from the dao result', async() => {
    // Arrange
    const faqs = [makeFaq()];
    jest.spyOn(faqDao, 'findAll').mockResolvedValue([faqs, 1]);
    const query: FindAllFaqQueryDto = { page: 1, size: 10 };

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(faqDao.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual({
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 1,
      totalPages: 1,
      data: faqs,
    });
  });
});
