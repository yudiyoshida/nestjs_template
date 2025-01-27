import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { SuccessMessage } from 'src/infra/openapi/success-message';
import { Swagger } from 'src/infra/openapi/swagger';
import { TextDto } from '../../application/dtos/text.dto';
import { EditTextInputDto } from '../../application/usecases/edit-text/dtos/edit-text.dto';
import { EditText } from '../../application/usecases/edit-text/edit-text.service';
import { FindTextByType } from '../../application/usecases/find-text-by-type/find-text-by-type.service';

@Controller('text')
export class TextController {
  constructor(
    private findTextByTypeService: FindTextByType,
    private editTextService: EditText,
  ) {}

  @Get(':type')
  @Swagger({
    tags: ['Textos'],
    summary: 'Rota para buscar um texto (termos, politica, sobre)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: TextDto,
  })
  public findOne(@Param('type') type: string): Promise<TextDto> {
    return this.findTextByTypeService.execute(type);
  }

  @Patch(':type')
  @Swagger({
    tags: ['Textos'],
    summary: 'Rota para editar um texto (termos, politica, sobre)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param('type') type: string, @Body() body: EditTextInputDto): Promise<SuccessMessage> {
    return this.editTextService.execute(type, body);
  }
}
