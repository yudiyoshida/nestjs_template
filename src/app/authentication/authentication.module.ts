import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AccountModule } from 'src/app/account/account.module';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { IssueRefreshTokenSession } from 'src/app/authentication/application/usecases/issue-refresh-token-session/issue-refresh-token-session.service';
import { Logout } from 'src/app/authentication/application/usecases/logout/logout.service';
import { RefreshToken } from 'src/app/authentication/application/usecases/refresh-token/refresh-token.service';
import { RevokeRefreshTokenSession } from 'src/app/authentication/application/usecases/revoke-refresh-token-session/revoke-refresh-token-session.service';
import { SignInWithCredentialAndPassword } from 'src/app/authentication/application/usecases/signin-with-credential-and-password/signin-with-credential-and-password.service';
import { ValidateRefreshTokenSession } from 'src/app/authentication/application/usecases/validate-refresh-token-session/validate-refresh-token-session.service';
import { AuthenticationController } from 'src/app/authentication/infra/drivers/http/authentication.controller';
import { JwtAuthModule } from 'src/app/authentication/infra/strategies/jwt/jwt.module';
import { ConfigModule } from 'src/core/config/config.module';

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
    IssueRefreshTokenSession,
    ValidateRefreshTokenSession,
    RevokeRefreshTokenSession,
    SignInWithCredentialAndPassword,
    RefreshToken,
    Logout,
  ],
})
export class AuthenticationModule {}
