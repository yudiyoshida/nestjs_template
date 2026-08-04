import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FaqNotFoundError } from 'src/app/_examples/faq/domain/errors/faq-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { FaqDto } from '../../dtos/faq.dto';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { EditFaqInputDto } from './dtos/edit-faq.dto';
import { EditFaq } from './edit-faq.service';

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

describe('EditFaq - Unit tests', () => {
  let sut: EditFaq;
  let faqDao: IFaqDao;

  beforeEach(async() => {
    faqDao = createMock<IFaqDao>();

    const module = await Test.createTestingModule({
      providers: [
        EditFaq,
        { provide: TOKENS.FaqDao, useValue: faqDao },
      ],
    }).compile();

    sut = module.get(EditFaq);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should throw FaqNotFoundError when the faq does not exist', async() => {
    // Arrange
    jest.spyOn(faqDao, 'findById').mockResolvedValue(null);
    const data: EditFaqInputDto = { question: 'Nova pergunta?' };

    // Act & Assert
    expect.assertions(1);
    return sut.execute('missing-id', data).catch((error) => {
      expect(error).toBeInstanceOf(FaqNotFoundError);
    });
  });

  it('should edit the faq and return the success message', async() => {
    // Arrange
    const faq = makeFaq();
    jest.spyOn(faqDao, 'findById').mockResolvedValue(faq);
    const data: EditFaqInputDto = { question: 'Nova pergunta?' };

    // Act
    const result = await sut.execute(faq.id, data);

    // Assert
    expect(faqDao.edit).toHaveBeenCalledWith(faq.id, data);
    expect(result).toEqual({ message: 'FAQ atualizado com sucesso' });
  });
});
