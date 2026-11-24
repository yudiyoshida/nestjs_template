import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FindAccountByCredential } from 'src/app/account/application/usecases/find-account-by-credential/find-account-by-credential.service';
import { Account } from 'src/app/account/domain/value-objects/account.vo';
import { ForbiddenAccountError } from 'src/app/authentication/application/errors/forbidden-account.error';
import { InactiveAccountError } from 'src/app/authentication/application/errors/inactive-account.error';
import { InvalidCredentialError } from 'src/app/authentication/application/errors/invalid-credential.error';
import { IssueRefreshTokenSession } from 'src/app/authentication/application/usecases/issue-refresh-token-session/issue-refresh-token-session.service';
import { SigninWithCredentialAndPasswordInputDto, SigninWithCredentialAndPasswordOutputDto } from 'src/app/authentication/application/usecases/signin-with-credential-and-password/dtos/signin-with-credential-and-password.dto';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { Password } from 'src/shared/value-objects/password/password.vo';

@Injectable()
export class SignInWithCredentialAndPassword {
  constructor(
    private readonly jwtService: JwtService,
    private readonly findAccountByCredential: FindAccountByCredential,
    private readonly issueRefreshTokenSession: IssueRefreshTokenSession,
  ) {}

  public async execute(data: SigninWithCredentialAndPasswordInputDto): Promise<SigninWithCredentialAndPasswordOutputDto> {
    const accountData = await this.findAccountByCredential.execute(data.credential);
    if (!accountData) {
      throw new InvalidCredentialError();
    }

    const isValidPassword = Password.compare(data.password, accountData.password);
    if (!isValidPassword) {
      throw new InvalidCredentialError();
    }

    const account = new Account(accountData.status, accountData.roles);
    if (account.isInactive) {
      throw new InactiveAccountError();
    }
    if (!account.canAuthenticate) {
      throw new ForbiddenAccountError();
    }

    const payload: Payload = {
      sub: accountData.id,
      roles: accountData.roles,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.issueRefreshTokenSession.execute(payload);

    return { accessToken, refreshToken };
  }
}
