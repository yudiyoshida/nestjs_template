import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { UploadS3AdapterGateway } from './adapters/aws-s3/upload-s3.gateway';
import { UploadFakeAdapterGateway } from './adapters/fake/upload-fake.gateway';
import { UploadFileModule } from './upload-file.module';

describe('UploadFileModule - Unit tests', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('register', () => {
    describe('Happy path', () => {
      it('should use UploadFakeAdapterGateway when NODE_ENV is test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;

        // Act
        const result = UploadFileModule.register();

        // Assert
        expect(result.providers).toEqual([
          { provide: TOKENS.UploadFileGateway, useClass: UploadFakeAdapterGateway },
        ]);
      });

      it('should use UploadS3AdapterGateway when NODE_ENV is production', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;

        // Act
        const result = UploadFileModule.register();

        // Assert
        expect(result.providers).toEqual([
          { provide: TOKENS.UploadFileGateway, useClass: UploadS3AdapterGateway },
        ]);
      });

      it('should return the module with ConfigModule imported and the gateway token exported', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;

        // Act
        const result = UploadFileModule.register();

        // Assert
        expect(result.module).toBe(UploadFileModule);
        expect(result.imports).toEqual([ConfigModule]);
        expect(result.exports).toEqual([TOKENS.UploadFileGateway]);
      });
    });

    describe('Edge cases', () => {
      it('should use UploadS3AdapterGateway when NODE_ENV is undefined', () => {
        // Arrange
        delete process.env.NODE_ENV;

        // Act
        const result = UploadFileModule.register();

        // Assert
        expect(result.providers).toEqual([
          { provide: TOKENS.UploadFileGateway, useClass: UploadS3AdapterGateway },
        ]);
      });
    });
  });
});
