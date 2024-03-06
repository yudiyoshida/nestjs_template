import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
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
      throw new ForbiddenException('Você não possui permissão para acessar este recurso.');
    }

    const account = ctx.switchToHttp().getRequest<Request>().auth;
    if (account.status === 'pendente') {
      throw new ForbiddenException('A sua conta ainda não foi aprovada pela administração.');
    }
    if (account.status !== 'ativo') {
      throw new ForbiddenException('A sua conta foi suspensa. Entre em contato com a administração para mais detalhes.');
    }

    const hasPermission = account.permissions.some(item => item.action === permission);
    if (!hasPermission) {
      throw new ForbiddenException('Você não possui permissão para acessar este recurso.');
    }
    return true;
  }
}
