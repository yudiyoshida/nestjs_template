import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { ConfigService } from 'src/core/config/config.service';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import type { SendForgotPasswordEmailInput } from '../../dtos/smtp.dto';
import type { ISmtpGateway } from '../../smtp.gateway';

@Injectable()
export class SmtpNodemailerAdapterGateway implements ISmtpGateway {
  constructor(private readonly config: ConfigService) {}

  public async sendForgotPasswordEmail(input: SendForgotPasswordEmailInput): Promise<void> {
    try {
      const templatePath = path.join(process.cwd(), 'resources/templates/email/forgot-password.hbs');
      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = handlebars.compile(templateSource);
      const html = template({ code: input.code });

      const transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        auth: {
          user: this.config.smtpUsername,
          pass: this.config.smtpPassword,
        },
      });

      await transporter.sendMail({
        from: this.config.smtpFrom,
        to: input.to,
        subject: 'Recuperação de senha — Kalpay',
        html,
      });
    } catch {
      throw new ExternalApiError('Não foi possível enviar o e-mail de recuperação de senha');
    }
  }
}
