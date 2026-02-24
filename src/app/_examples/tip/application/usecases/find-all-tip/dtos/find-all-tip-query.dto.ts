import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { TipType } from 'src/app/_examples/tip/domain/enums/tip-type.enum';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllTipQueryDto extends Queries {
  @ApiPropertyOptional({ enum: TipType })
  @IsOptional()
  @IsEnum(TipType, { message: '$property deve ser um valor válido do enum' })
  type?: TipType;

  @ApiPropertyOptional({ enum: TipStatus })
  @IsOptional()
  @IsEnum(TipStatus, { message: '$property deve ser um valor válido do enum' })
  status?: TipStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  locationId?: string;
}
