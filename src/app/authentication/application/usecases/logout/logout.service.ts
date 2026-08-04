import { Injectable } from '@nestjs/common';
import { RefreshTokenSession } from 'src/app/authentication/application/services/refresh-token-session/refresh-token-session.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';

@Injectable()
export class Logout {
  constructor(
    private readonly refreshTokenSession: RefreshTokenSession,
  ) {}

  public async execute(accountId: string): Promise<SuccessMessage> {
    await this.refreshTokenSession.revoke(accountId);

    return { message: 'Sessão encerrada com sucesso.' };
  }
}
