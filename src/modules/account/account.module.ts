import { Module } from '@nestjs/common';

import { TOKENS } from 'src/shared/di/tokens';
import { BcryptAdapterService } from 'src/shared/helpers/hashing/adapters/bcrypt.service';
import { AccountPrismaAdapterRepository } from './repositories/adapters/account-prisma.repository';

import { CreateAccountController } from './use-cases/create-account/create-account.controller';
import { CreateAccountService } from './use-cases/create-account/create-account.service';

import { GetAccountByEmailService } from './use-cases/get-account-by-email/get-account-by-email.service';
import { GetAccountByIdService } from './use-cases/get-account-by-id/get-account-by-id.service';

@Module({
  controllers: [
    CreateAccountController,
  ],
  providers: [
    CreateAccountService,
    GetAccountByEmailService,
    GetAccountByIdService,
    {
      provide: TOKENS.IAccountRepository,
      useClass: AccountPrismaAdapterRepository,
    },
    {
      provide: TOKENS.IHashingService,
      useClass: BcryptAdapterService,
    },
  ],
  exports: [
    GetAccountByEmailService,
  ],
})
export class AccountModule {}
