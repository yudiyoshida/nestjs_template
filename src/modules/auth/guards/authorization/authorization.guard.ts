import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Errors } from 'src/shared/errors/error-message';
import { PERMISSION_KEY } from '../../decorators/set-permission.decorator';
import { AccountPermissionEnum } from '../../enums/permissions.enum';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // handler first, then class. This way, the value in the controller will be overwritten by the method (more specific).
    const permission = this.reflector.getAllAndOverride<AccountPermissionEnum>(PERMISSION_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!permission) {
      throw new ForbiddenException(Errors.FORBIDDEN);
    }

    const account = ctx.switchToHttp().getRequest<Request>().auth;
    if (account.status === 'pendente') {
      throw new ForbiddenException(Errors.ACCOUNT_STATUS_PENDING);
    }
    if (account.status !== 'ativo') {
      throw new ForbiddenException(Errors.ACCOUNT_STATUS_INACTIVE);
    }

    const hasPermission = account.permissions.some(item => item.action === permission);
    if (!hasPermission) {
      throw new ForbiddenException(Errors.FORBIDDEN);
    }
    return true;
  }
}
