import { Injectable } from '@nestjs/common';
import { RevokeRefreshTokenSession } from 'src/app/authentication/application/usecases/revoke-refresh-token-session/revoke-refresh-token-session.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';

@Injectable()
export class Logout {
  constructor(
    private readonly revokeRefreshTokenSession: RevokeRefreshTokenSession,
  ) {}

  public async execute(accountId: string): Promise<SuccessMessage> {
    await this.revokeRefreshTokenSession.execute(accountId);

    return { message: 'Sessão encerrada com sucesso.' };
  }
}
