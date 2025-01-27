import { Injectable, NotFoundException } from '@nestjs/common';
import { TextDao } from 'src/modules/text/infra/persistence/text.dao';
import { Errors } from 'src/shared/errors/message';
import { TextDto } from '../../dtos/text.dto';

@Injectable()
export class FindTextByType {
  constructor(private textDao: TextDao) {}

  public async execute(type: string): Promise<TextDto> {
    const text = await this.textDao.findByType(type);

    if (!text) {
      throw new NotFoundException(Errors.TEXT_NOT_FOUND);
    }
    return text;
  }
}
