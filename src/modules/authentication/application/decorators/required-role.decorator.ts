import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AccountRole } from '@prisma/client';
import { ServerError } from 'src/shared/errors/error.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { SetRoles } from './set-role.decorator';

export function RequiredRoles(...roles: AccountRole[]) {
  return applyDecorators(
    SetRoles(...roles),
    UseGuards(AuthenticationGuard, AuthorizationGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ type: ServerError, description: 'Unauthorized' }),
    ApiForbiddenResponse({ type: ServerError, description: 'Forbidden' }),
  );
}
