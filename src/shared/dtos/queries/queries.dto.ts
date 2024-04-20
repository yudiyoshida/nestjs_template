import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { StringToNumber } from 'src/shared/validators/decorators/string-to-number';

export class QueriesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'page deve ser um número inteiro.' })
  @IsPositive({ message: 'page deve ser um número positivo.' })
  @StringToNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'size deve ser um número inteiro.' })
  @IsPositive({ message: 'size deve ser um número positivo.' })
  @StringToNumber()
  size?: number;
}
