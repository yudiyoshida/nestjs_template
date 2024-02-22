import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { AccountModule } from './modules/account/account.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    RouterModule.register([
      {
        path: 'accounts',
        module: AccountModule,
      },
      {
        path: 'login',
        module: AuthModule,
      },
    ]),
  ],
})
export class AppRouterModule {}
