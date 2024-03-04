import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Validate } from 'class-validator';
import { IsPositiveIntegerNumber } from 'src/shared/validators/constraints/int-positive-number';

export class Queries {
  @ApiPropertyOptional()
  @IsOptional()
  @Validate(IsPositiveIntegerNumber)
  page: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Validate(IsPositiveIntegerNumber)
  size: number;
}
