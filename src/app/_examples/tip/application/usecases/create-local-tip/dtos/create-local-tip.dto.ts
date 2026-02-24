import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateLocalTipInputDto {
  @ApiProperty({ example: 'Pouso requer atenção' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo 256 caracteres' })
  @Trim()
  title: string;

  @ApiProperty({ example: 'Pista principal tem buracos no setor norte. Recomenda-se inspeção visual antes de pousar.' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  content: string;

  @ApiProperty({ example: 'Aeroporto Santos Dumont' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  locationId: string;
}

export class CreateLocalTipOutputDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
}
