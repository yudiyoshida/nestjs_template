import { ValidationPipeOptions } from '@nestjs/common';

const pipeOptions: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
};

export { pipeOptions };
