import { SetMetadata } from '@nestjs/common';
import { AccountRole } from '@prisma/client';

export const ROLE_KEY = 'ROLE';
export const SetRoles = (...roles: AccountRole[]) => SetMetadata(ROLE_KEY, roles);
