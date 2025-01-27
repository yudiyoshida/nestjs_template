import { Injectable } from '@nestjs/common';
import { FaqDao } from 'src/modules/faq/infra/persistence/faq.dao';
import { CreateFaqInputDto, CreateFaqOutputDto } from './dtos/create-faq.dto';

@Injectable()
export class CreateFaq {
  constructor(private faqDao: FaqDao) {}

  public async execute(data: CreateFaqInputDto): Promise<CreateFaqOutputDto> {
    const result = await this.faqDao.save(data);

    return { id: result.id };
  }
}
