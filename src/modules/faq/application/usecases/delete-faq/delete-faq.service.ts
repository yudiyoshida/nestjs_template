import { Injectable, NotFoundException } from '@nestjs/common';
import { SuccessMessage } from 'src/infra/openapi/success-message';
import { FaqDao } from 'src/modules/faq/infra/persistence/faq.dao';
import { Errors } from 'src/shared/errors/message';

@Injectable()
export class DeleteFaq {
  constructor(private faqDao: FaqDao) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const faq = await this.faqDao.findById(id);
    if (!faq) {
      throw new NotFoundException(Errors.FAQ_NOT_FOUND);
    }

    await this.faqDao.delete(faq.id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
