import { DynamicModule } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { SmtpVendor } from 'src/infra/infra-vendors';
import { SmtpFakeAdapterGateway } from './adapters/fake/smtp-fake.gateway';
import { SmtpNodemailerAdapterGateway } from './adapters/nodemailer/smtp-nodemailer.gateway';
import { SmtpModule } from './smtp.module';

describe('SmtpModule - Unit tests', () => {
  let originalNodeEnv: string | undefined;
  let originalSmtpVendor: string | undefined;

  const getGatewayProvider = (module: DynamicModule): any =>
    (module.providers ?? []).find(
      (provider: any) => provider?.provide === TOKENS.SmtpGateway,
    );

  const restoreEnv = (key: string, value: string | undefined): void => {
    if (value === undefined) {
      delete process.env[key];

      return;
    }

    process.env[key] = value;
  };

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalSmtpVendor = process.env.SMTP_VENDOR;
  });

  afterEach(() => {
    restoreEnv('NODE_ENV', originalNodeEnv);
    restoreEnv('SMTP_VENDOR', originalSmtpVendor);
  });

  describe('register', () => {
    describe('Happy path', () => {
      it('should bind the fake adapter when NODE_ENV is test even with a real vendor configured', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;
        process.env.SMTP_VENDOR = SmtpVendor.Nodemailer;

        // Act
        const result = SmtpModule.register();

        // Assert
        expect(getGatewayProvider(result).useClass).toBe(SmtpFakeAdapterGateway);
        expect(result.imports).toEqual([]);
      });

      it('should bind the nodemailer adapter with ConfigModule when SMTP_VENDOR is nodemailer outside test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.SMTP_VENDOR = SmtpVendor.Nodemailer;

        // Act
        const result = SmtpModule.register();

        // Assert
        expect(getGatewayProvider(result).useClass).toBe(SmtpNodemailerAdapterGateway);
        expect(result.imports).toContain(ConfigModule);
      });

      it('should bind the fake adapter when SMTP_VENDOR is fake outside test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.SMTP_VENDOR = SmtpVendor.Fake;

        // Act
        const result = SmtpModule.register();

        // Assert
        expect(getGatewayProvider(result).useClass).toBe(SmtpFakeAdapterGateway);
        expect(result.imports).toEqual([]);
      });

      it('should return the module itself exporting the smtp gateway token', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.SMTP_VENDOR = SmtpVendor.Nodemailer;

        // Act
        const result = SmtpModule.register();

        // Assert
        expect(result.module).toBe(SmtpModule);
        expect(result.exports).toEqual([TOKENS.SmtpGateway]);
        expect(getGatewayProvider(result).provide).toBe(TOKENS.SmtpGateway);
      });
    });

    describe('Error path', () => {
      it('should throw when SMTP_VENDOR is not a known vendor', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.SMTP_VENDOR = 'sendgrid';

        // Act & Assert
        expect(() => SmtpModule.register()).toThrow('Invalid SMTP_VENDOR "sendgrid"');
      });
    });

    describe('Edge cases', () => {
      it('should throw with an empty vendor when SMTP_VENDOR is not set outside test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        delete process.env.SMTP_VENDOR;

        // Act & Assert
        expect(() => SmtpModule.register()).toThrow('Invalid SMTP_VENDOR ""');
      });
    });
  });
});
