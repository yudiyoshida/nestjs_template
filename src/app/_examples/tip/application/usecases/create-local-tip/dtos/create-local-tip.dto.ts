import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateLocalTipInputDto {
  @ApiProperty({ example: 'Pouso requer atenção' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  @Trim()
  title: string;

  @ApiProperty({ example: 'Pista principal tem buracos no setor norte. Recomenda-se inspeção visual antes de pousar.' })
  @IsString()
  @IsNotEmpty()
  @Trim()
  content: string;

  @ApiProperty({ example: 'Aeroporto Santos Dumont' })
  @IsString()
  @IsNotEmpty()
  @Trim()
  locationId: string;
}

export class CreateLocalTipOutputDto {
  id: string;
}
