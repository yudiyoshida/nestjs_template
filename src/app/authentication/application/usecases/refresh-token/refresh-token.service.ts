import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FindAccountById } from 'src/app/account/application/usecases/find-account-by-id/find-account-by-id.service';
import { Account } from 'src/app/account/domain/value-objects/account.vo';
import { RefreshTokenSession } from 'src/app/authentication/application/usecases/refresh-token-session/refresh-token-session.service';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ForbiddenAccountError } from '../../errors/forbidden-account.error';
import { InactiveAccountError } from '../../errors/inactive-account.error';
import { InvalidRefreshTokenError } from '../../errors/invalid-refresh-token.error';
import { RefreshTokenInputDto, RefreshTokenOutputDto } from './dtos/refresh-token.dto';

@Injectable()
export class RefreshToken {
  constructor(
    private readonly jwtService: JwtService,
    private readonly findAccountById: FindAccountById,
    private readonly refreshTokenSession: RefreshTokenSession,
  ) {}

  public async execute(data: RefreshTokenInputDto): Promise<RefreshTokenOutputDto> {
    const payload = await this.refreshTokenSession.validate(data.refreshToken);

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
    const refreshToken = await this.refreshTokenSession.issue(newPayload);

    return { accessToken, refreshToken };
  }
}
