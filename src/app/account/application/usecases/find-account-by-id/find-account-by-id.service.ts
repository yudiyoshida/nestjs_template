import { Inject, Injectable } from '@nestjs/common';
import { AccountDto } from 'src/app/account/application/dtos/account.dto';
import type { IAccountDao } from 'src/app/account/application/persistence/dao/account-dao.interface';
import { TOKENS } from 'src/core/di/token';

@Injectable()
export class FindAccountById {
  constructor(
    @Inject(TOKENS.AccountDao) private readonly accountDao: IAccountDao,
  ) {}

  public async execute(id: string): Promise<AccountDto | null> {
    return this.accountDao.findById(id);
  }
}
