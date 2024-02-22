import { UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { ServerError } from 'src/shared/errors/error.entity';
import { AccountPermissionsEnum } from '../enums/permissions.enum';
import { AuthenticationGuard } from '../guards/authentication/authentication.guard';
import { AuthorizationGuard } from '../guards/authorization/authorization.guard';
import { SetPermission } from './set-permission.decorator';

export function RequiredPermission(permission: AccountPermissionsEnum) {
  return applyDecorators(
    SetPermission(permission),
    UseGuards(AuthenticationGuard, AuthorizationGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ type: ServerError, description: 'Unauthorized' }),
    ApiForbiddenResponse({ type: ServerError, description: 'Forbidden' }),
  );
}
