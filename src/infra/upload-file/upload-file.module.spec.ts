import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { UploadFileAwsS3AdapterGateway } from './adapters/aws-s3/upload-file-aws-s3.gateway';
import { UploadFileFakeAdapterGateway } from './adapters/fake/upload-file-fake.gateway';
import { UploadFileModule } from './upload-file.module';

describe('UploadFileModule - Unit tests', () => {
  let originalNodeEnv: string | undefined;
  let originalUploadFileVendor: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalUploadFileVendor = process.env.UPLOAD_FILE_VENDOR;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalUploadFileVendor === undefined) {
      delete process.env.UPLOAD_FILE_VENDOR;
    }
    else {
      process.env.UPLOAD_FILE_VENDOR = originalUploadFileVendor;
    }
  });

  describe('register', () => {
    describe('Happy path', () => {
      it('should use UploadFileFakeAdapterGateway when NODE_ENV is test even with UPLOAD_FILE_VENDOR set to aws-s3', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;
        process.env.UPLOAD_FILE_VENDOR = 'aws-s3';

        // Act
        const result = UploadFileModule.register();

        // Assert
        expect(result.imports).toEqual([]);
        expect(result.providers).toEqual([
          { provide: TOKENS.UploadFileGateway, useClass: UploadFileFakeAdapterGateway },
        ]);
      });

      it('should use UploadFileFakeAdapterGateway when NODE_ENV is production and UPLOAD_FILE_VENDOR is fake', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.UPLOAD_FILE_VENDOR = 'fake';

        // Act
        const result = UploadFileModule.register();

        // Assert
        expect(result.imports).toEqual([]);
        expect(result.providers).toEqual([
          { provide: TOKENS.UploadFileGateway, useClass: UploadFileFakeAdapterGateway },
        ]);
      });

      it('should use UploadFileAwsS3AdapterGateway when NODE_ENV is production and UPLOAD_FILE_VENDOR is aws-s3', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.UPLOAD_FILE_VENDOR = 'aws-s3';

        // Act
        const result = UploadFileModule.register();

        // Assert
        expect(result.imports).toEqual([ConfigModule]);
        expect(result.providers).toEqual([
          { provide: TOKENS.UploadFileGateway, useClass: UploadFileAwsS3AdapterGateway },
        ]);
      });

      it('should return the module with empty imports and the gateway token exported when NODE_ENV is test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;
        process.env.UPLOAD_FILE_VENDOR = 'aws-s3';

        // Act
        const result = UploadFileModule.register();

        // Assert
        expect(result.module).toBe(UploadFileModule);
        expect(result.imports).toEqual([]);
        expect(result.exports).toEqual([TOKENS.UploadFileGateway]);
      });
    });

    describe('Error path', () => {
      it('should throw when NODE_ENV is production and UPLOAD_FILE_VENDOR is invalid', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.UPLOAD_FILE_VENDOR = 'azure-storage-account';

        // Act & Assert
        expect(() => UploadFileModule.register()).toThrow('Invalid UPLOAD_FILE_VENDOR "azure-storage-account"');
      });

      it('should throw when NODE_ENV is production and UPLOAD_FILE_VENDOR is missing', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        delete process.env.UPLOAD_FILE_VENDOR;

        // Act & Assert
        expect(() => UploadFileModule.register()).toThrow('Invalid UPLOAD_FILE_VENDOR ""');
      });
    });

    describe('Edge cases', () => {
      it('should use UploadFileAwsS3AdapterGateway when NODE_ENV is undefined and UPLOAD_FILE_VENDOR is aws-s3', () => {
        // Arrange
        delete process.env.NODE_ENV;
        process.env.UPLOAD_FILE_VENDOR = 'aws-s3';

        // Act
        const result = UploadFileModule.register();

        // Assert
        expect(result.imports).toEqual([ConfigModule]);
        expect(result.providers).toEqual([
          { provide: TOKENS.UploadFileGateway, useClass: UploadFileAwsS3AdapterGateway },
        ]);
      });
    });
  });
});
