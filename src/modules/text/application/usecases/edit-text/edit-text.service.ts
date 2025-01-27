import { Injectable } from '@nestjs/common';
import { SuccessMessage } from 'src/infra/openapi/success-message';
import { TextDao } from 'src/modules/text/infra/persistence/text.dao';
import { EditTextInputDto } from './dtos/edit-text.dto';

@Injectable()
export class EditText {
  constructor(private textDao: TextDao) {}

  public async execute(type: string, data: EditTextInputDto): Promise<SuccessMessage> {
    await this.textDao.edit(type, data);

    return { message: 'Edição realizada com sucesso' };
  }
}
