import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

import { IAccountRepository } from '../account-repository.interface';

import { IAccountPermissionDto } from '../../entities/account-permission.entity';
import { IAccountDto } from '../../entities/account.entity';
import { CreateAccountDto } from '../../use-cases/create-account/dtos/create-account.dto';

@Injectable()
export class AccountInMemoryRepository implements IAccountRepository {
  private readonly _accounts: IAccountDto[] = [];

  public async findById(id: string) {
    const account = this._accounts.find(account => account.id === id);

    if (account) {
      delete account.password;
    }
    return account;
  }

  public async findByEmail(email: string) {
    return this._accounts.find(account => account.email === email);
  }

  public async save(data: CreateAccountDto, permissions: IAccountPermissionDto[]) {
    const newAccount = { id: crypto.randomUUID(), ...data };

    this._accounts.push({ ...newAccount, permissions });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...body } = newAccount;

    return body;
  }
}
