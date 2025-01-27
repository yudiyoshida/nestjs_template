import { Injectable, NotFoundException } from '@nestjs/common';
import { FaqDao } from 'src/modules/faq/infra/persistence/faq.dao';
import { Errors } from 'src/shared/errors/message';
import { FaqDto } from '../../dtos/faq.dto';

@Injectable()
export class FindFaqById {
  constructor(private faqDao: FaqDao) {}

  public async execute(id: string): Promise<FaqDto> {
    const faq = await this.faqDao.findById(id);

    if (!faq) {
      throw new NotFoundException(Errors.FAQ_NOT_FOUND);
    }
    return faq;
  }
}
