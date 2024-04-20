import { Type, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/config/validation-pipe';

export function dtoValidator(metatype: Type<any>, data: any) {
  const target = new ValidationPipe(pipeOptions);

  return target.transform(data, { type: 'body', metatype });
}
