import { Module } from '@nestjs/common';

import { AccountModule } from '../account/account.module';

import { TOKENS } from 'src/shared/di/tokens';
import { BcryptAdapterService } from 'src/shared/helpers/hashing/adapters/bcrypt.service';
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
