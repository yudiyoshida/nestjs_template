import { AccountPermission } from '../entities/account-permission.entity';
import { IAccountDto } from '../entities/account.entity';
import { CreateAccountDto } from '../use-cases/create-account/dtos/create-account.dto';

export interface IAccountRepository {
  findById(id: string): Promise<Omit<IAccountDto, 'password'> | null>;
  findByEmail(email: string): Promise<IAccountDto | null>;
  save(data: CreateAccountDto, permissions: AccountPermission[]): Promise<Omit<IAccountDto, 'password' | 'permissions'>>;
}
