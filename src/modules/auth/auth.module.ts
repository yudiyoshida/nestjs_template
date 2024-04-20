import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';

import { BcryptAdapterService } from 'src/infra/hashing/adapters/bcrypt.service';
import { TOKENS } from 'src/shared/ioc/tokens';

import { LoginController } from './use-cases/login/login.controller';
import { LoginService } from './use-cases/login/login.service';

@Module({
  imports: [
    AccountModule,
  ],
  controllers: [
    LoginController,
  ],
  providers: [
    LoginService,
    {
      provide: TOKENS.IHashingService,
      useClass: BcryptAdapterService,
    },
  ],
})
export class AuthModule {}
