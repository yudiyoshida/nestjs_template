import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FaqNotFoundError } from 'src/app/_examples/faq/domain/errors/faq-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { FaqDto } from '../../dtos/faq.dto';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { DeleteFaq } from './delete-faq.service';

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

describe('DeleteFaq - Unit tests', () => {
  let sut: DeleteFaq;
  let faqDao: IFaqDao;

  beforeEach(async() => {
    faqDao = createMock<IFaqDao>();

    const module = await Test.createTestingModule({
      providers: [
        DeleteFaq,
        { provide: TOKENS.FaqDao, useValue: faqDao },
      ],
    }).compile();

    sut = module.get(DeleteFaq);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
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

  it('should delete the faq and return the success message', async() => {
    // Arrange
    const faq = makeFaq();
    jest.spyOn(faqDao, 'findById').mockResolvedValue(faq);

    // Act
    const result = await sut.execute(faq.id);

    // Assert
    expect(faqDao.delete).toHaveBeenCalledWith(faq.id);
    expect(result).toEqual({ message: 'FAQ excluído com sucesso' });
  });
});
