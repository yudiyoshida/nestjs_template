import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AuthenticationGuard } from 'src/app/authentication/application/guards/authentication/authentication.guard';
import { AuthorizationGuard } from 'src/app/authentication/application/guards/authorization/authorization.guard';
import { SetRoles } from 'src/app/authentication/infra/decorators/set-role.decorator';
import { JwtAuthGuard } from 'src/app/authentication/infra/strategies/jwt/jwt.guard';
import { ServerError } from 'src/infra/openapi/error.dto';

export function RequiredRoles(...roles: AccountRole[]) {
  return applyDecorators(
    SetRoles(...roles),
    UseGuards(JwtAuthGuard, AuthenticationGuard, AuthorizationGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ type: ServerError, description: 'Unauthorized' }),
    ApiForbiddenResponse({ type: ServerError, description: 'Forbidden' }),
  );
}
