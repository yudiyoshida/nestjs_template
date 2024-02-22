import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';

export const Auth = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<Request>().auth;
});
