import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateWeatherTipInputDto {
  @ApiProperty({ example: 'Ventos fortes hoje' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  @Trim()
  title: string;

  @ApiProperty({ example: 'Rajadas de vento podem chegar a 60 km/h durante a tarde. Evite voos em baixa altitude.' })
  @IsString()
  @IsNotEmpty()
  @Trim()
  content: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsString()
  @IsOptional()
  @Trim()
  locationId?: string;
}

export class CreateWeatherTipOutputDto {
  id: string;
  expiresAt: Date;
}
