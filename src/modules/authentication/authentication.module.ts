import { Module } from '@nestjs/common';
import { JwtAuthModule } from './application/services/jwt/jwt.module';
import { PasswordModule } from './application/services/password/password.module';
import { LoginService } from './application/usecases/login/login.service';
import { AuthenticationController } from './infra/http/authentication.controller';
import { AuthenticationDao } from './infra/persistence/authentication.dao';

@Module({
  imports: [
    JwtAuthModule,
    PasswordModule,
  ],
  controllers: [
    AuthenticationController,
  ],
  providers: [
    AuthenticationDao,
    LoginService,
  ],
})
export class AuthenticationModule {}
