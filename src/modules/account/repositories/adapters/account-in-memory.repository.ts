import { Injectable } from '@nestjs/common';

import { AccountPermission } from '../../entities/account-permission.entity';
import { Account } from '../../entities/account.entity';
import { CreateAccountDto } from '../../use-cases/create-account/dtos/create-account.dto';
import { IAccountRepository } from '../account-repository.interface';

@Injectable()
export class AccountInMemoryAdapterRepository implements IAccountRepository {
  private readonly _accounts: Account[] = [];

  public async findById(id: string) {
    const account = this._accounts.find(account => account.id === id);
    if (!account) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...data } = account;

    return data;
  }

  public async findByEmail(email: string) {
    const account = this._accounts.find(account => account.email === email);

    return account ?? null;
  }

  public async save(data: CreateAccountDto, permissions: AccountPermission[]) {
    const now = new Date().getTime();
    const newAccount = { id: now.toString(), ...data };

    this._accounts.push({ ...newAccount, permissions });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...body } = newAccount;

    return body;
  }
}
