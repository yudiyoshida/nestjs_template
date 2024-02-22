import { Module } from '@nestjs/common';

import { AccountModule } from '../account/account.module';

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
  ],
})
export class AuthModule {}
