import { ValidationPipeOptions } from '@nestjs/common';

export const pipeOptions: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
};
