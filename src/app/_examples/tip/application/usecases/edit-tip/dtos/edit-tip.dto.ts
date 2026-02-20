import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class EditTipInputDto {
  @ApiPropertyOptional({ example: 'Ventos fortes hoje (atualizado)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  @Trim()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Rajadas de vento podem chegar a 70 km/h. Evite voos em baixa altitude.' })
  @IsString()
  @IsNotEmpty()
  @Trim()
  @IsOptional()
  content?: string;
}
