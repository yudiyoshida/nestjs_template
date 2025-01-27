import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SuccessMessage } from 'src/infra/openapi/success-message';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/dtos/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination';
import { FaqDto } from '../../application/dtos/faq.dto';
import { CreateFaq } from '../../application/usecases/create-faq/create-faq.service';
import { CreateFaqInputDto, CreateFaqOutputDto } from '../../application/usecases/create-faq/dtos/create-faq.dto';
import { DeleteFaq } from '../../application/usecases/delete-faq/delete-faq.service';
import { EditFaqInputDto } from '../../application/usecases/edit-faq/dtos/edit-faq.dto';
import { EditFaq } from '../../application/usecases/edit-faq/edit-faq.service';
import { FindAllFaqsQueryDto } from '../../application/usecases/find-all-faqs/dtos/find-all-faqs.dto';
import { FindAllFaqs } from '../../application/usecases/find-all-faqs/find-all-faqs.service';
import { FindFaqById } from '../../application/usecases/find-faq-by-id/find-faq-by-id.service';

@Controller('faq')
export class FaqController {
  constructor(
    private createFaqService: CreateFaq,
    private findAllFaqsService: FindAllFaqs,
    private findFaqByIdService: FindFaqById,
    private editFaqService: EditFaq,
    private deleteFaqService: DeleteFaq,
  ) {}

  @Post()
  @Swagger({
    tags: ['Faq'],
    summary: 'Rota para criar uma nova FAQ',
    applyBadRequest: true,
    createdResponse: CreateFaqOutputDto,
  })
  public create(@Body() body: CreateFaqInputDto): Promise<CreateFaqOutputDto> {
    return this.createFaqService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Faq'],
    summary: 'Rota para listar todas as FAQs',
    applyBadRequest: true,
    okPaginatedResponse: FaqDto,
  })
  public findAll(@Query() queries: FindAllFaqsQueryDto): Promise<IPagination<FaqDto>> {
    return this.findAllFaqsService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Faq'],
    summary: 'Rota para buscar uma FAQ',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: FaqDto,
  })
  public findOne(@Param() params: Params): Promise<FaqDto> {
    return this.findFaqByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Faq'],
    summary: 'Rota para editar uma FAQ',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditFaqInputDto): Promise<SuccessMessage> {
    return this.editFaqService.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Faq'],
    summary: 'Rota para deletar uma FAQ',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteFaqService.execute(params.id);
  }
}
