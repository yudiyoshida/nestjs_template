import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from 'src/core/config/config.module';
import { AccountModule } from '../account/account.module';
import { AuthenticationGuardsModule } from './application/guards/guards.module';
import { RefreshTokenSession } from './application/usecases/refresh-token-session/refresh-token-session.service';
import { Logout } from './application/usecases/logout/logout.service';
import { RefreshToken } from './application/usecases/refresh-token/refresh-token.service';
import { SignInWithCredentialAndPassword } from './application/usecases/signin-with-credential-and-password/signin-with-credential-and-password.service';
import { AuthenticationController } from './infra/drivers/http/authentication.controller';
import { JwtAuthModule } from './infra/strategies/jwt/jwt.module';

@Module({
  imports: [
    JwtAuthModule,
    PassportModule,
    ConfigModule,
    AccountModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    AuthenticationController,
  ],
  providers: [
    RefreshTokenSession,
    SignInWithCredentialAndPassword,
    RefreshToken,
    Logout,
  ],
})
export class AuthenticationModule {}
