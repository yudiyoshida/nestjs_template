import { Module, Provider } from '@nestjs/common';
import { AccountPrismaAdapterDao } from 'src/app/account/infra/driven/persistence/prisma/account-prisma.dao';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';

const adapters: Provider[] = [
  {
    provide: TOKENS.AccountDao,
    useClass: AccountPrismaAdapterDao,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class AccountPersistenceModule {}
