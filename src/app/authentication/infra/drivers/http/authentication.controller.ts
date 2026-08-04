import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Logout } from 'src/app/authentication/application/usecases/logout/logout.service';
import { RefreshTokenInputDto, RefreshTokenOutputDto } from 'src/app/authentication/application/usecases/refresh-token/dtos/refresh-token.dto';
import { RefreshToken } from 'src/app/authentication/application/usecases/refresh-token/refresh-token.service';
import { SigninWithCredentialAndPasswordInputDto, SigninWithCredentialAndPasswordOutputDto } from 'src/app/authentication/application/usecases/signin-with-credential-and-password/dtos/signin-with-credential-and-password.dto';
import { SignInWithCredentialAndPassword } from 'src/app/authentication/application/usecases/signin-with-credential-and-password/signin-with-credential-and-password.service';
import type { Payload } from 'src/app/authentication/domain/types/payload.type';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { RequiredRoles } from '../../decorators/required-role.decorator';
import { User } from '../../decorators/user.decorator';

@Controller('auth')
export class AuthenticationController {
  constructor(
    private readonly signInWithCredentialAndPassword: SignInWithCredentialAndPassword,
    private readonly refreshTokenService: RefreshToken,
    private readonly logoutService: Logout,
    // private readonly forgotPassword: ForgotPassword,
    // private readonly resetPassword: ResetPassword
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['Autenticação'],
    summary: 'Login com email e senha',
    applyBadRequest: true,
    applyForbidden: true,
    okResponse: SigninWithCredentialAndPasswordOutputDto,
  })
  public async signInWithCredential(@Body() body: SigninWithCredentialAndPasswordInputDto): Promise<SigninWithCredentialAndPasswordOutputDto> {
    return this.signInWithCredentialAndPassword.execute(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['Autenticação'],
    summary: 'Renovar access token usando um refresh token válido',
    applyBadRequest: true,
    okResponse: RefreshTokenOutputDto,
  })
  public async refresh(@Body() body: RefreshTokenInputDto): Promise<RefreshTokenOutputDto> {
    return this.refreshTokenService.execute(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @RequiredRoles()
  @Swagger({
    tags: ['Autenticação'],
    summary: 'Encerrar a sessão atual, revogando o refresh token',
    okResponse: SuccessMessage,
  })
  public async logout(@User() user: Payload): Promise<SuccessMessage> {
    return this.logoutService.execute(user.sub);
  }

  // @Post('forgot-password')
  // @HttpCode(HttpStatus.OK)
  // public async forgotPass(@Body() body: ForgotPasswordInputDto): Promise<SuccessMessage> {
  //   return this.forgotPassword.execute(body);
  // }

  // @Post('reset-password')
  // @HttpCode(HttpStatus.OK)
  // public async resetPass(@Body() body: ResetPasswordInputDto): Promise<SuccessMessage> {
  //   return this.resetPassword.execute(body);
  // }
}
