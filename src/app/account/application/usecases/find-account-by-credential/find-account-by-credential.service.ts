import { Inject, Injectable } from '@nestjs/common';
import { AccountWithSensitiveDataDto } from 'src/app/account/application/dtos/account.dto';
import type { IAccountDao } from 'src/app/account/application/persistence/dao/account-dao.interface';
import { TOKENS } from 'src/core/di/token';

@Injectable()
export class FindAccountByCredential {
  constructor(
    @Inject(TOKENS.AccountDao) private readonly accountDao: IAccountDao,
  ) {}

  public async execute(credential: string): Promise<AccountWithSensitiveDataDto | null> {
    return this.accountDao.findByCredential(credential);
  }
}
