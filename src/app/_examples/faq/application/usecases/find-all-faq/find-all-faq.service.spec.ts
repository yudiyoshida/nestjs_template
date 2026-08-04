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

  it('should return an empty paginated dto when the dao returns no rows', async() => {
    // Arrange
    jest.spyOn(faqDao, 'findAll').mockResolvedValue([[], 0]);
    const query: FindAllFaqQueryDto = { page: 1, size: 10 };

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(faqDao.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual({
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 0,
      data: [],
    });
  });

  it('should build pagination metadata for a non-first page', async() => {
    // Arrange
    const faqs = Array.from({ length: 10 }, (_, index) =>
      makeFaq({ id: `faq-${index}` }),
    );
    jest.spyOn(faqDao, 'findAll').mockResolvedValue([faqs, 25]);
    const query: FindAllFaqQueryDto = { page: 2, size: 10 };

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(faqDao.findAll).toHaveBeenCalledWith(query);
    expect(result.currentPage).toBe(2);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalItems).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.data).toEqual(faqs);
    expect(result.data).toHaveLength(10);
  });
});
