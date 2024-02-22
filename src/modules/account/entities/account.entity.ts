import { AccountPermission } from './account-permission.entity';

export interface IAccountDto {
  id: string;
  name: string;
  email: string;
  password: string;
  permissions: AccountPermission[];
}

export class Account implements IAccountDto {
  id: string;
  name: string;
  email: string;
  password: string;
  permissions: AccountPermission[];
}
