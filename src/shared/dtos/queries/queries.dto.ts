import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Validate } from 'class-validator';
import { IsPositiveIntegerNumber } from 'src/shared/validators/custom-validators/positive-int-number';
import { StringToNumber } from 'src/shared/validators/decorators/string-to-number';

export class Queries {
  @ApiPropertyOptional()
  @IsOptional()
  @Validate(IsPositiveIntegerNumber)
  @StringToNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Validate(IsPositiveIntegerNumber)
  @StringToNumber()
  size?: number;
}
