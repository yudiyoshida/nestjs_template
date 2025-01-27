import { Module } from '@nestjs/common';
import { CreateFaq } from './application/usecases/create-faq/create-faq.service';
import { DeleteFaq } from './application/usecases/delete-faq/delete-faq.service';
import { EditFaq } from './application/usecases/edit-faq/edit-faq.service';
import { FindAllFaqs } from './application/usecases/find-all-faqs/find-all-faqs.service';
import { FindFaqById } from './application/usecases/find-faq-by-id/find-faq-by-id.service';
import { FaqController } from './infra/http/faq.controller';
import { FaqDao } from './infra/persistence/faq.dao';

@Module({
  controllers: [
    FaqController,
  ],
  providers: [
    FaqDao,
    CreateFaq,
    FindAllFaqs,
    FindFaqById,
    EditFaq,
    DeleteFaq,
  ],
})
export class FaqModule {}
