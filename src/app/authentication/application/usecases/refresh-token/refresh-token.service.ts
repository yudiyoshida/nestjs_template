import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FindAccountById } from 'src/app/account/application/usecases/find-account-by-id/find-account-by-id.service';
import { Account } from 'src/app/account/domain/value-objects/account.vo';
import { ForbiddenAccountError } from 'src/app/authentication/application/errors/forbidden-account.error';
import { InactiveAccountError } from 'src/app/authentication/application/errors/inactive-account.error';
import { InvalidRefreshTokenError } from 'src/app/authentication/application/errors/invalid-refresh-token.error';
import { IssueRefreshTokenSession } from 'src/app/authentication/application/usecases/issue-refresh-token-session/issue-refresh-token-session.service';
import { RefreshTokenInputDto, RefreshTokenOutputDto } from 'src/app/authentication/application/usecases/refresh-token/dtos/refresh-token.dto';
import { ValidateRefreshTokenSession } from 'src/app/authentication/application/usecases/validate-refresh-token-session/validate-refresh-token-session.service';
import { Payload } from 'src/app/authentication/domain/types/payload.type';

@Injectable()
export class RefreshToken {
  constructor(
    private readonly jwtService: JwtService,
    private readonly findAccountById: FindAccountById,
    private readonly validateRefreshTokenSession: ValidateRefreshTokenSession,
    private readonly issueRefreshTokenSession: IssueRefreshTokenSession,
  ) {}

  public async execute(data: RefreshTokenInputDto): Promise<RefreshTokenOutputDto> {
    const payload = await this.validateRefreshTokenSession.execute(data.refreshToken);

    const accountData = await this.findAccountById.execute(payload.sub);
    if (!accountData) {
      throw new InvalidRefreshTokenError();
    }

    const account = new Account(accountData.status, accountData.roles);
    if (account.isInactive) {
      throw new InactiveAccountError();
    }
    if (!account.canAuthenticate) {
      throw new ForbiddenAccountError();
    }

    const newPayload: Payload = {
      sub: accountData.id,
      roles: accountData.roles,
    };
    const accessToken = this.jwtService.sign(newPayload);
    const refreshToken = await this.issueRefreshTokenSession.execute(newPayload);

    return { accessToken, refreshToken };
  }
}
