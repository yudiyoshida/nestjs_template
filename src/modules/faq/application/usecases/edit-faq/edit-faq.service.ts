import { Injectable, NotFoundException } from '@nestjs/common';
import { SuccessMessage } from 'src/infra/openapi/success-message';
import { FaqDao } from 'src/modules/faq/infra/persistence/faq.dao';
import { Errors } from 'src/shared/errors/message';
import { EditFaqInputDto } from './dtos/edit-faq.dto';

@Injectable()
export class EditFaq {
  constructor(private faqDao: FaqDao) {}

  public async execute(id: string, data: EditFaqInputDto): Promise<SuccessMessage> {
    const faq = await this.faqDao.findById(id);
    if (!faq) {
      throw new NotFoundException(Errors.FAQ_NOT_FOUND);
    }

    await this.faqDao.edit(faq.id, data);

    return { message: 'Edição realizada com sucesso' };
  }
}
