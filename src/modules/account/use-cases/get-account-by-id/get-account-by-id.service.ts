import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Errors } from 'src/shared/errors/error-message';
import { TOKENS } from 'src/shared/ioc/tokens';
import { IAccountRepository } from '../../repositories/account-repository.interface';

@Injectable()
export class GetAccountByIdService {
  constructor(
    @Inject(TOKENS.IAccountRepository) private accountRepository: IAccountRepository
  ) {}

  public async execute(id: string) {
    const account = await this.accountRepository.findById(id);

    if (!account) {
      throw new NotFoundException(Errors.ACCOUNT_NOT_FOUND);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...data } = account;

    return data;
  }
}
