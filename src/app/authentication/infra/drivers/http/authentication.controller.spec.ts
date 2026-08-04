import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RefreshTokenInputDto, RefreshTokenOutputDto } from 'src/app/authentication/application/usecases/refresh-token/dtos/refresh-token.dto';
import { SigninWithCredentialAndPasswordInputDto, SigninWithCredentialAndPasswordOutputDto } from 'src/app/authentication/application/usecases/signin-with-credential-and-password/dtos/signin-with-credential-and-password.dto';
import { AuthenticationModule } from 'src/app/authentication/authentication.module';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { AuthenticationController } from './authentication.controller';

describe('AuthenticationController - Unit tests', () => {
  let sut: AuthenticationController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationModule],
    }).compile();

    sut = module.get(AuthenticationController);
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should login', async() => {
    // Arrange
    const body = createMock<SigninWithCredentialAndPasswordInputDto>();
    const output = createMock<SigninWithCredentialAndPasswordOutputDto>();
    const signinSpy = jest.spyOn(sut['signInWithCredentialAndPassword'], 'execute').mockResolvedValue(output);

    // Act
    const result = await sut.signInWithCredential(body);

    // Assert
    expect(result).toEqual(output);
    expect(signinSpy).toHaveBeenCalledWith(body);
  });

  it('should refresh the token pair', async() => {
    // Arrange
    const body = createMock<RefreshTokenInputDto>();
    const output = createMock<RefreshTokenOutputDto>();
    const refreshSpy = jest.spyOn(sut['refreshTokenService'], 'execute').mockResolvedValue(output);

    // Act
    const result = await sut.refresh(body);

    // Assert
    expect(result).toEqual(output);
    expect(refreshSpy).toHaveBeenCalledWith(body);
  });

  it('should logout', async() => {
    // Arrange
    const user = createMock<Payload>({ sub: '123', roles: [AccountRole.STUDENT] });
    const output = createMock<SuccessMessage>();
    const logoutSpy = jest.spyOn(sut['logoutService'], 'execute').mockResolvedValue(output);

    // Act
    const result = await sut.logout(user);

    // Assert
    expect(result).toEqual(output);
    expect(logoutSpy).toHaveBeenCalledWith(user.sub);
  });

  // it('should forgot password only admins', async() => {
  //   // Arrange
  //   const body = createMock<ForgotPasswordInputDto>();
  //   const output = createMock<SuccessMessage>();
  //   const forgotPasswordSpy = jest.spyOn(sut['forgotPassword'], 'execute').mockResolvedValue(output);

  //   // Act
  //   const result = await sut.forgotPass(body);

  //   // Assert
  //   expect(result).toEqual(output);
  //   expect(forgotPasswordSpy).toHaveBeenCalledWith(body, AccountRole.ADMIN);
  // });

  // it('should reset password only admins', async() => {
  //   // Arrange
  //   const body = createMock<ResetPasswordInputDto>();
  //   const output = createMock<SuccessMessage>();
  //   const resetPasswordSpy = jest.spyOn(sut['resetPassword'], 'execute').mockResolvedValue(output);

  //   // Act
  //   const result = await sut.resetPass(body);

  //   // Assert
  //   expect(result).toEqual(output);
  //   expect(resetPasswordSpy).toHaveBeenCalledWith(body, AccountRole.ADMIN);
  // });
});
