import { Module } from '@nestjs/common';
import { EditText } from './application/usecases/edit-text/edit-text.service';
import { FindTextByType } from './application/usecases/find-text-by-type/find-text-by-type.service';
import { TextController } from './infra/http/text.controller';
import { TextDao } from './infra/persistence/text.dao';

@Module({
  controllers: [
    TextController,
  ],
  providers: [
    TextDao,
    FindTextByType,
    EditText,
  ],
})
export class TextModule {}
