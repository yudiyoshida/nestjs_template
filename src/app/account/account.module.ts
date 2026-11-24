import { Module, Provider } from '@nestjs/common';
import { AccountPersistenceModule } from 'src/app/account/application/persistence/account-persistence.module';
import { FindAccountByCredential } from 'src/app/account/application/usecases/find-account-by-credential/find-account-by-credential.service';
import { FindAccountById } from 'src/app/account/application/usecases/find-account-by-id/find-account-by-id.service';

const providers: Provider[] = [
  FindAccountByCredential,
  FindAccountById,
];

@Module({
  imports: [
    AccountPersistenceModule,
  ],
  providers: [...providers],
  exports: [...providers],
})
export class AccountModule {}
