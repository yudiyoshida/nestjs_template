import { AccountPermission } from './account-permission.entity';

export class Account {
  id: string;
  name: string;
  email: string;
  password: string;
  permissions: AccountPermission[];
}
