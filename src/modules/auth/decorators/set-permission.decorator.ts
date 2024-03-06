import { SetMetadata } from '@nestjs/common';
import { AccountPermissionEnum } from '../enums/permissions.enum';

export const PERMISSION_KEY = 'PERMISSION';
export const SetPermission = (permission: AccountPermissionEnum) => SetMetadata(PERMISSION_KEY, permission);
