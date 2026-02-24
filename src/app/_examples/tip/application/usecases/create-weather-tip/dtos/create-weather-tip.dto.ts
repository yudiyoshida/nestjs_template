import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateWeatherTipInputDto {
  @ApiProperty({ example: 'Ventos fortes hoje' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo 256 caracteres' })
  @Trim()
  title: string;

  @ApiProperty({ example: 'Rajadas de vento podem chegar a 60 km/h durante a tarde. Evite voos em baixa altitude.' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  content: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsString({ message: '$property deve ser uma string' })
  @IsOptional()
  @Trim()
  locationId?: string;
}

export class CreateWeatherTipOutputDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '2025-02-24T12:00:00.000Z' })
  expiresAt: Date;
}
