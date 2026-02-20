import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { TipDto } from 'src/app/_examples/tip/application/dtos/tip.dto';
import { CreateLocalTip } from 'src/app/_examples/tip/application/usecases/create-local-tip/create-local-tip.service';
import { CreateLocalTipInputDto, CreateLocalTipOutputDto } from 'src/app/_examples/tip/application/usecases/create-local-tip/dtos/create-local-tip.dto';
import { CreateWeatherTip } from 'src/app/_examples/tip/application/usecases/create-weather-tip/create-weather-tip.service';
import { CreateWeatherTipInputDto, CreateWeatherTipOutputDto } from 'src/app/_examples/tip/application/usecases/create-weather-tip/dtos/create-weather-tip.dto';
import { DeleteTip } from 'src/app/_examples/tip/application/usecases/delete-tip/delete-tip.service';
import { EditTipInputDto } from 'src/app/_examples/tip/application/usecases/edit-tip/dtos/edit-tip.dto';
import { EditTip } from 'src/app/_examples/tip/application/usecases/edit-tip/edit-tip.service';
import { FindAllTipQueryDto } from 'src/app/_examples/tip/application/usecases/find-all-tip/dtos/find-all-tip-query.dto';
import { FindAllTip } from 'src/app/_examples/tip/application/usecases/find-all-tip/find-all-tip.service';
import { FindTipById } from 'src/app/_examples/tip/application/usecases/find-tip-by-id/find-tip-by-id.service';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import type { Payload } from 'src/app/authentication/domain/types/payload.type';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { User } from 'src/app/authentication/infra/decorators/user.decorator';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/tips')
@RequiredRoles(AccountRole.ADMIN)
export class TipAdminController {
  constructor(
    private readonly createWeatherTip: CreateWeatherTip,
    private readonly createLocalTip: CreateLocalTip,
    private readonly findAllTip: FindAllTip,
    private readonly findTipById: FindTipById,
    private readonly editTip: EditTip,
    private readonly deleteTip: DeleteTip,
  ) {}

  @Post('weather')
  @Swagger({
    tags: ['Portal Gerencial - Dicas'],
    summary: 'Criar nova dica meteorológica (expira em 24h)',
    applyBadRequest: true,
    createdResponse: CreateWeatherTipOutputDto,
  })
  public async createWeather(@Body() body: CreateWeatherTipInputDto, @User() user: Payload): Promise<CreateWeatherTipOutputDto> {
    return this.createWeatherTip.execute(body, user.sub);
  }

  @Post('local')
  @Swagger({
    tags: ['Portal Gerencial - Dicas'],
    summary: 'Criar nova dica local (sem expiração)',
    applyBadRequest: true,
    createdResponse: CreateLocalTipOutputDto,
  })
  public async createLocal(@Body() body: CreateLocalTipInputDto, @User() user: Payload): Promise<CreateLocalTipOutputDto> {
    return this.createLocalTip.execute(body, user.sub);
  }

  @Get()
  @Swagger({
    tags: ['Portal Gerencial - Dicas'],
    summary: 'Listar dicas com paginação e filtros',
    okPaginatedResponse: TipDto,
  })
  public async findAll(@Query() query: FindAllTipQueryDto): Promise<IPagination<TipDto>> {
    return this.findAllTip.execute(query);
  }

  @Get(':id')
  @Swagger({
    tags: ['Portal Gerencial - Dicas'],
    summary: 'Buscar dica por ID. Retorna null se a dica não for encontrada.',
    applyNotFound: true,
    okResponse: TipDto,
  })
  public async findById(@Param() params: Params): Promise<TipDto | null> {
    return this.findTipById.execute(params.id);
  }

  @Put(':id')
  @Swagger({
    tags: ['Portal Gerencial - Dicas'],
    summary: 'Editar dica',
    applyBadRequest: true,
    applyNotFound: true,
    applyForbidden: true,
    okResponse: SuccessMessage,
  })
  public async edit(@Param() params: Params, @Body() body: EditTipInputDto): Promise<SuccessMessage> {
    return this.editTip.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Portal Gerencial - Dicas'],
    summary: 'Deletar dica permanentemente (admin pode deletar qualquer dica)',
    applyNotFound: true,
    applyForbidden: true,
    okResponse: SuccessMessage,
  })
  public async delete(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteTip.execute(params.id);
  }
}
