import { Injectable } from '@nestjs/common';
import { FaqDao } from 'src/modules/faq/infra/persistence/faq.dao';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination';
import { FaqDto } from '../../dtos/faq.dto';
import { FindAllFaqsQueryDto } from './dtos/find-all-faqs.dto';

@Injectable()
export class FindAllFaqs {
  constructor(private faqDao: FaqDao) {}

  public async execute(queries: FindAllFaqsQueryDto): Promise<IPagination<FaqDto>> {
    const [result, total] = await this.faqDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getResult();
  }
}
