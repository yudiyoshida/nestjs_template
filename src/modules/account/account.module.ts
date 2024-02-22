import { Module, Provider } from '@nestjs/common';

import { TOKENS } from 'src/shared/di/tokens';
import { BcryptAdapterService } from 'src/shared/helpers/hashing/adapters/bcrypt.service';
import { AccountPrismaRepository } from './repositories/adapters/account-prisma.repository';

import { CreateAccountController } from './use-cases/create-account/create-account.controller';
import { CreateAccountService } from './use-cases/create-account/create-account.service';

import { GetAccountByIdService } from './use-cases/get-account-by-id/get-account-by-id.service';

const providers: Provider[] = [
  CreateAccountService,
  GetAccountByIdService,
  {
    provide: TOKENS.IAccountRepository,
    useClass: AccountPrismaRepository,
  },
  {
    provide: TOKENS.IHashingService,
    useClass: BcryptAdapterService,
  },
];

@Module({
  controllers: [
    CreateAccountController,
  ],
  providers: [...providers],
  exports: [...providers],
})
export class AccountModule {}
