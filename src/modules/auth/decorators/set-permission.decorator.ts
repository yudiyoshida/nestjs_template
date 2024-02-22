import { SetMetadata } from '@nestjs/common';
import { AccountPermissionsEnum } from '../enums/permissions.enum';

export const PERMISSION_KEY = 'PERMISSION';
export const SetPermission = (permission: AccountPermissionsEnum) => SetMetadata(PERMISSION_KEY, permission);
