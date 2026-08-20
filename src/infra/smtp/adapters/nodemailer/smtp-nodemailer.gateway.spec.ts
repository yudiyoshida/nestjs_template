import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { SmtpNodemailerAdapterGateway } from './smtp-nodemailer.gateway';

jest.mock('fs');
jest.mock('handlebars');
jest.mock('nodemailer');

describe('SmtpNodemailerAdapterGateway - Unit tests', () => {
  let sut: SmtpNodemailerAdapterGateway;
  let logger: ILoggerGateway;
  let configService: ConfigService;

  let mockSendMail: jest.Mock;
  let mockTemplate: jest.Mock;

  beforeEach(async() => {
    mockSendMail = jest.fn().mockResolvedValue(undefined);
    mockTemplate = jest.fn().mockReturnValue('<html>rendered</html>');

    jest.mocked(fs.readFileSync).mockReturnValue('<html>{{code}}</html>');
    jest.mocked(handlebars.compile).mockReturnValue(mockTemplate as any);
    jest.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: mockSendMail } as any);

    logger = createMock<ILoggerGateway>();
    configService = createMock<ConfigService>({
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpUsername: 'user',
      smtpPassword: 'pass',
      smtpFrom: 'noreply@example.com',
    });

    const module = await Test.createTestingModule({
      providers: [
        SmtpNodemailerAdapterGateway,
        { provide: TOKENS.LoggerGateway, useValue: logger },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    sut = module.get(SmtpNodemailerAdapterGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendForgotPasswordEmail', () => {
    describe('Happy path', () => {
      it('should render the template with the received code', async() => {
        // Act
        await sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' });

        // Assert
        expect(mockTemplate).toHaveBeenCalledWith({ code: '123456' });
      });

      it('should create the transport with the configured credentials', async() => {
        // Act
        await sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' });

        // Assert
        expect(nodemailer.createTransport).toHaveBeenCalledWith({
          host: 'smtp.example.com',
          port: 587,
          auth: { user: 'user', pass: 'pass' },
        });
      });

      it('should send the rendered email to the received recipient', async() => {
        // Act
        await sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' });

        // Assert
        expect(mockSendMail).toHaveBeenCalledWith({
          from: 'noreply@example.com',
          to: 'user@example.com',
          subject: 'Recuperação de senha — Kalpay',
          html: '<html>rendered</html>',
        });
      });

      it('should not log when the email is sent', async() => {
        // Act
        await sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' });

        // Assert
        expect(logger.error).not.toHaveBeenCalled();
      });
    });

    describe('Error path', () => {
      it('should throw ExternalApiError when the template file cannot be read', async() => {
        // Arrange
        jest.mocked(fs.readFileSync).mockImplementation(() => {
          throw new Error('ENOENT');
        });

        // Act & Assert
        await expect(sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' }))
          .rejects.toThrow(ExternalApiError);
      });

      it('should not send the email when the template file cannot be read', async() => {
        // Arrange
        jest.mocked(fs.readFileSync).mockImplementation(() => {
          throw new Error('ENOENT');
        });

        // Act
        await sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' })
          .catch(() => undefined);

        // Assert
        expect(mockSendMail).not.toHaveBeenCalled();
      });

      it('should throw ExternalApiError when sendMail fails', async() => {
        // Arrange
        mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));

        // Act & Assert
        await expect(sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' }))
          .rejects.toThrow(ExternalApiError);
      });

      it('should throw with the pt-BR message when sendMail fails', async() => {
        // Arrange
        mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));

        // Act & Assert
        await expect(sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' }))
          .rejects.toThrow('Não foi possível enviar o e-mail de recuperação de senha');
      });

      it('should log the smtp context with the adapter, action and vendor error when sendMail fails', async() => {
        // Arrange
        const vendorError = new Error('SMTP connection refused');
        mockSendMail.mockRejectedValue(vendorError);

        // Act
        await sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' })
          .catch(() => undefined);

        // Assert
        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(LogContext.SMTP, {
          adapter: 'nodemailer',
          action: 'sendForgotPasswordEmail',
          body: { to: 'user@example.com' },
          error: vendorError,
        });
      });

      it('should not log the recovery code nor the rendered html when sendMail fails', async() => {
        // Arrange
        mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));
        await sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' })
          .catch(() => undefined);

        // Act
        const payload = JSON.stringify(jest.mocked(logger.error).mock.calls[0][1]);

        // Assert
        expect(payload).not.toContain('123456');
        expect(payload).not.toContain('<html>rendered</html>');
      });
    });

    describe('Edge cases', () => {
      it('should create the transport only once across multiple sends', async() => {
        // Act
        await sut.sendForgotPasswordEmail({ to: 'first@example.com', code: '111111' });
        await sut.sendForgotPasswordEmail({ to: 'second@example.com', code: '222222' });

        // Assert
        expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
        expect(mockSendMail).toHaveBeenCalledTimes(2);
      });

      it('should reuse the cached transport when a previous send failed', async() => {
        // Arrange
        mockSendMail.mockRejectedValueOnce(new Error('SMTP connection refused'));

        // Act
        await sut.sendForgotPasswordEmail({ to: 'first@example.com', code: '111111' })
          .catch(() => undefined);
        await sut.sendForgotPasswordEmail({ to: 'second@example.com', code: '222222' });

        // Assert
        expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
        expect(mockSendMail).toHaveBeenCalledTimes(2);
      });

      it.each([
        '',
        '   ',
        null,
        undefined,
      ])('should forward the recipient to the vendor without validating it (%s)', async(to: any) => {
        // Act
        await sut.sendForgotPasswordEmail({ to, code: '123456' });

        // Assert
        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to }));
      });

      it.each([
        '',
        null,
        undefined,
      ])('should render the template with the received code without validating it (%s)', async(code: any) => {
        // Act
        await sut.sendForgotPasswordEmail({ to: 'user@example.com', code });

        // Assert
        expect(mockTemplate).toHaveBeenCalledWith({ code });
      });
    });
  });
});
