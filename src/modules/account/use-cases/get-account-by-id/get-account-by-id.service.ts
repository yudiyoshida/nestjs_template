import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { TOKENS } from 'src/shared/di/tokens';
import { IAccountRepository } from '../../repositories/account-repository.interface';

@Injectable()
export class GetAccountByIdService {
  constructor(
    @Inject(TOKENS.IAccountRepository) private accountRepository: IAccountRepository
  ) {}

  public async execute(id: string) {
    const account = await this.accountRepository.findById(id);

    if (!account) {
      throw new NotFoundException('Conta não encontrada na base de dados.');
    }
    return account;
  }
}
