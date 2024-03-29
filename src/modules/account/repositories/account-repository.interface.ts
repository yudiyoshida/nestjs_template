import { AccountPermission } from '../entities/account-permission.entity';
import { Account } from '../entities/account.entity';
import { AccountStatus } from '../types/account-status.type';
import { CreateAccountDto } from '../use-cases/create-account/dtos/create-account.dto';

export interface IAccountRepository {
  findById(id: string): Promise<Account|null>;
  findByEmail(email: string): Promise<Account|null>;
  save(data: CreateAccountDto, status: AccountStatus, permissions: AccountPermission[]): Promise<Account>;
}
