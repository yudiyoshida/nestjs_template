import { AccountStatus } from '../types/account-status.type';
import { AccountPermission } from './account-permission.entity';

export class Account {
  id: string;
  name: string;
  email: string;
  password: string;
  status: AccountStatus;
  permissions: AccountPermission[];
}
