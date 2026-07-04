import { Injectable } from '@nestjs/common';
import type { SendForgotPasswordEmailInput } from '../../dtos/smtp.dto';
import type { ISmtpGateway } from '../../smtp.gateway';

@Injectable()
export class SmtpFakeAdapterGateway implements ISmtpGateway {
  public readonly sentForgotPasswordEmails: SendForgotPasswordEmailInput[] = [];

  public async sendForgotPasswordEmail(input: SendForgotPasswordEmailInput): Promise<void> {
    this.sentForgotPasswordEmails.push(input);
  }
}
