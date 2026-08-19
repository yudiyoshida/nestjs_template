import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { LoggerFakeAdapterGateway } from './adapters/fake/logger-fake.gateway';
import { LoggerWinstonAdapterGateway } from './adapters/winston/logger-winston.gateway';
import { LoggerModule } from './logger.module';

describe('LoggerModule - Unit tests', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalLoggerVendor = process.env.LOGGER_VENDOR;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.LOGGER_VENDOR = originalLoggerVendor;
  });

  describe('register', () => {
    describe('Happy path', () => {
      it('should force the fake adapter when NODE_ENV is test even with a real vendor', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;
        process.env.LOGGER_VENDOR = 'winston';

        // Act
        const result = LoggerModule.register();

        // Assert
        expect(result.providers).toEqual([
          { provide: TOKENS.LoggerGateway, useClass: LoggerFakeAdapterGateway },
        ]);
      });

      it('should bind the winston adapter when LOGGER_VENDOR is winston outside test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Development;
        process.env.LOGGER_VENDOR = 'winston';

        // Act
        const result = LoggerModule.register();

        // Assert
        expect(result.providers).toEqual([
          { provide: TOKENS.LoggerGateway, useClass: LoggerWinstonAdapterGateway },
        ]);
      });

      it('should bind the fake adapter when LOGGER_VENDOR is fake outside test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Development;
        process.env.LOGGER_VENDOR = 'fake';

        // Act
        const result = LoggerModule.register();

        // Assert
        expect(result.providers).toEqual([
          { provide: TOKENS.LoggerGateway, useClass: LoggerFakeAdapterGateway },
        ]);
      });

      it('should return the module itself and export the logger token', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Development;
        process.env.LOGGER_VENDOR = 'winston';

        // Act
        const result = LoggerModule.register();

        // Assert
        expect(result.module).toBe(LoggerModule);
        expect(result.exports).toEqual([TOKENS.LoggerGateway]);
      });
    });

    describe('Error path', () => {
      beforeEach(() => {
        process.env.NODE_ENV = Environment.Development;
      });

      it('should throw when LOGGER_VENDOR is invalid outside test', () => {
        // Arrange
        process.env.LOGGER_VENDOR = 'xpto';

        // Act & Assert
        expect(() => LoggerModule.register()).toThrow('Invalid LOGGER_VENDOR "xpto"');
      });

      it('should throw when LOGGER_VENDOR is missing outside test', () => {
        // Arrange
        delete process.env.LOGGER_VENDOR;

        // Act & Assert
        expect(() => LoggerModule.register()).toThrow('Invalid LOGGER_VENDOR ""');
      });

      it('should throw when LOGGER_VENDOR is an empty string outside test', () => {
        // Arrange
        process.env.LOGGER_VENDOR = '';

        // Act & Assert
        expect(() => LoggerModule.register()).toThrow('Invalid LOGGER_VENDOR ""');
      });
    });

    describe('Edge cases', () => {
      it('should not import extra modules when the fake adapter is bound', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;
        process.env.LOGGER_VENDOR = 'winston';

        // Act
        const result = LoggerModule.register();

        // Assert
        expect(result.imports).toEqual([]);
      });

      it('should not import extra modules when the winston adapter is bound', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Development;
        process.env.LOGGER_VENDOR = 'winston';

        // Act
        const result = LoggerModule.register();

        // Assert
        expect(result.imports).toEqual([]);
      });
    });
  });
});
