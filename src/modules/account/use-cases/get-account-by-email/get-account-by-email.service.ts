import { Inject, Injectable } from '@nestjs/common';

import { TOKENS } from 'src/shared/di/tokens';
import { IAccountRepository } from '../../repositories/account-repository.interface';

@Injectable()
export class GetAccountByEmailService {
  constructor(
    @Inject(TOKENS.IAccountRepository) private accountRepository: IAccountRepository,
  ) {}

  public async execute(email: string) {
    return this.accountRepository.findByEmail(email);
  }
}
