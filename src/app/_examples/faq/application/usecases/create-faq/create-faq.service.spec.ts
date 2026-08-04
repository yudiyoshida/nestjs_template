import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { CreateFaq } from './create-faq.service';
import { CreateFaqInputDto } from './dtos/create-faq.dto';

function makeInput(overrides: Partial<CreateFaqInputDto> = {}): CreateFaqInputDto {
  return {
    question: 'Como faço para recuperar minha senha?',
    answer: 'Clique em "Esqueci minha senha" na tela de login.',
    ...overrides,
  };
}

describe('CreateFaq - Unit tests', () => {
  let sut: CreateFaq;
  let faqDao: IFaqDao;

  beforeEach(async() => {
    faqDao = createMock<IFaqDao>();

    const module = await Test.createTestingModule({
      providers: [
        CreateFaq,
        { provide: TOKENS.FaqDao, useValue: faqDao },
      ],
    }).compile();

    sut = module.get(CreateFaq);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should save the faq and return its id', async() => {
    // Arrange
    const data = makeInput();
    jest.spyOn(faqDao, 'save').mockResolvedValue('faq-id');

    // Act
    const result = await sut.execute(data);

    // Assert
    expect(faqDao.save).toHaveBeenCalledWith(data);
    expect(result).toEqual({ id: 'faq-id' });
  });
});
