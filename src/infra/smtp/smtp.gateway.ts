import type { SendForgotPasswordEmailInput } from './dtos/smtp.dto';

export interface ISmtpGateway {
  sendForgotPasswordEmail(input: SendForgotPasswordEmailInput): Promise<void>;
}
