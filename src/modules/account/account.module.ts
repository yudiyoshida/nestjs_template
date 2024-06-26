import { Module } from '@nestjs/common';

import { BcryptAdapterService } from 'src/infra/hashing/adapters/bcrypt.service';
import { TOKENS } from 'src/shared/ioc/tokens';
// import { AccountPrismaAdapterRepository } from './repositories/adapters/account-prisma.repository';
import { AccountInMemoryAdapterRepository } from './repositories/adapters/account-in-memory.repository';

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
      useClass: AccountInMemoryAdapterRepository,
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
