import { Module } from '@nestjs/common';
import { AccountModule } from 'src/app/account/account.module';
import { AuthenticationGuard } from 'src/app/authentication/application/guards/authentication/authentication.guard';
import { AuthorizationGuard } from 'src/app/authentication/application/guards/authorization/authorization.guard';
import { CacheModule } from 'src/infra/cache/cache.module';

@Module({
  imports: [
    AccountModule,
    CacheModule.register(),
  ],
  providers: [
    AuthenticationGuard,
    AuthorizationGuard,
  ],
  exports: [
    AccountModule,
    AuthenticationGuard,
    AuthorizationGuard,
  ],
})
export class AuthenticationGuardsModule {}
