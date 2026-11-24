import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import type { SendForgotPasswordEmailInput } from '../../dtos/smtp.dto';
import type { ISmtpGateway } from '../../smtp.gateway';
import type { NodemailerMailOptions, NodemailerTransportOptions } from './dtos/nodemailer.dto';

@Injectable()
export class SmtpNodemailerAdapterGateway implements ISmtpGateway {
  private readonly TEMPLATES_DIR = 'resources/templates/email';

  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly config: ConfigService,
  ) {}

  public async sendForgotPasswordEmail(input: SendForgotPasswordEmailInput): Promise<void> {
    try {
      const html = this.render('forgot-password', { code: input.code });

      await this.getTransporter().sendMail(this.toVendorMail(input.to, 'Recuperação de senha', html));
    }
    catch (error) {
      this.logger.error(LogContext.SMTP, {
        adapter: 'nodemailer',
        action: 'sendForgotPasswordEmail',
        body: { to: input.to },
        error,
      });
      throw new ExternalApiError('Não foi possível enviar o e-mail de recuperação de senha');
    }
  }

  private render(name: string, context: Record<string, unknown>): string {
    handlebars.registerPartial('footer', this.readTemplate('partials/footer.hbs'));
    const body = handlebars.compile(this.readTemplate(`${name}.hbs`))(context);

    return handlebars.compile(this.readTemplate('layouts/default.hbs'))({ body });
  }

  private readTemplate(file: string): string {
    return fs.readFileSync(path.join(process.cwd(), this.TEMPLATES_DIR, file), 'utf-8');
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport(this.toVendorTransport());
    }

    return this.transporter;
  }

  private toVendorTransport(): NodemailerTransportOptions {
    return {
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      auth: {
        user: this.config.smtpUsername,
        pass: this.config.smtpPassword,
      },
    };
  }

  private toVendorMail(to: string, subject: string, html: string): NodemailerMailOptions {
    return {
      from: this.config.smtpFrom,
      to,
      subject,
      html,
    };
  }
}
