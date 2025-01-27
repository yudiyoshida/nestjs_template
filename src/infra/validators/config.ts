import { ValidationPipeOptions } from '@nestjs/common';

const pipeOptions: ValidationPipeOptions = {
  whitelist: true,
  transform: true,
  stopAtFirstError: true,
};

export { pipeOptions };
