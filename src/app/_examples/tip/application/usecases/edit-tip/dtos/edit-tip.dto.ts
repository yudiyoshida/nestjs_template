import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class EditTipInputDto {
  @ApiPropertyOptional({ example: 'Ventos fortes hoje (atualizado)' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo 256 caracteres' })
  @Trim()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Rajadas de vento podem chegar a 70 km/h. Evite voos em baixa altitude.' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  @IsOptional()
  content?: string;
}
