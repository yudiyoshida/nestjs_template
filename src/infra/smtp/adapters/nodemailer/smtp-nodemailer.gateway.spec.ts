import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import { ConfigService } from 'src/core/config/config.service';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { SmtpNodemailerAdapterGateway } from './smtp-nodemailer.gateway';

jest.mock('fs');
jest.mock('handlebars');
jest.mock('nodemailer');

describe('SmtpNodemailerAdapterGateway - Unit tests', () => {
  let sut: SmtpNodemailerAdapterGateway;
  let configService: jest.Mocked<Pick<ConfigService, 'smtpHost' | 'smtpPort' | 'smtpUsername' | 'smtpPassword' | 'smtpFrom'>>;

  let mockSendMail: jest.Mock;
  let mockTemplate: jest.Mock;

  beforeEach(() => {
    mockSendMail = jest.fn().mockResolvedValue(undefined);
    mockTemplate = jest.fn().mockReturnValue('<html>rendered</html>');

    jest.mocked(fs.readFileSync).mockReturnValue('<html>{{code}}</html>');
    jest.mocked(handlebars.compile).mockReturnValue(mockTemplate as any);
    jest.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: mockSendMail } as any);

    configService = {
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpUsername: 'user',
      smtpPassword: 'pass',
      smtpFrom: 'noreply@example.com',
    };

    sut = new SmtpNodemailerAdapterGateway(configService as unknown as ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendForgotPasswordEmail', () => {
    it('should render the template with the code and send the email', async() => {
      // Act
      await sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' });

      // Assert
      expect(mockTemplate).toHaveBeenCalledWith({ code: '123456' });
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        auth: { user: 'user', pass: 'pass' },
      });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: 'user@example.com',
        subject: 'Recuperação de senha — Kalpay',
        html: '<html>rendered</html>',
      });
    });

    it('should throw ExternalApiError when template file cannot be read', async() => {
      // Arrange
      jest.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      // Act & Assert
      await expect(sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' }))
        .rejects.toThrow(ExternalApiError);
      await expect(sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' }))
        .rejects.toThrow('Não foi possível enviar o e-mail de recuperação de senha');
    });

    it('should throw ExternalApiError when sendMail fails', async() => {
      // Arrange
      mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));

      // Act & Assert
      await expect(sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' }))
        .rejects.toThrow(ExternalApiError);
      await expect(sut.sendForgotPasswordEmail({ to: 'user@example.com', code: '123456' }))
        .rejects.toThrow('Não foi possível enviar o e-mail de recuperação de senha');
    });
  });
});
