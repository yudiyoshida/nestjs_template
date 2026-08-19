import { createMock } from '@golevelup/ts-jest';
import { DeleteObjectCommand, S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Test } from '@nestjs/testing';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { type ILoggerGateway, LogContext } from 'src/infra/logger/logger.gateway';
import type { UploadFileInputDto } from '../../dtos/upload-file.dto';
import { UploadFileAwsS3AdapterGateway } from './upload-file-aws-s3.gateway';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/lib-storage');

jest.mock('crypto', () => ({
  ...jest.requireActual<typeof import('crypto')>('crypto'),
  randomUUID: jest.fn(() => '00000000-0000-0000-0000-000000000001'),
}));

const buildInput = (overrides: Partial<UploadFileInputDto> = {}): UploadFileInputDto => ({
  buffer: Buffer.from('data'),
  originalName: 'photo.jpg',
  mimeType: 'image/jpeg',
  sizeInBytes: 4,
  ...overrides,
});

describe('UploadFileAwsS3AdapterGateway - Unit tests', () => {
  let sut: UploadFileAwsS3AdapterGateway;
  let logger: ILoggerGateway;
  let configService: ConfigService;
  let mockS3Send: jest.Mock;
  let mockUploadDone: jest.Mock;

  beforeEach(async() => {
    mockS3Send = jest.fn().mockResolvedValue(undefined);
    mockUploadDone = jest.fn().mockResolvedValue({
      Location: 'https://my-bucket.s3.amazonaws.com/client-attachments/00000000-0000-0000-0000-000000000001-photo.jpg',
    });

    jest.mocked(S3).mockImplementation(() => ({ send: mockS3Send }) as unknown as S3);
    jest.mocked(Upload).mockImplementation(() => ({ done: mockUploadDone }) as unknown as Upload);
    jest.mocked(DeleteObjectCommand).mockImplementation((input) => input as unknown as DeleteObjectCommand);

    logger = createMock<ILoggerGateway>();
    configService = createMock<ConfigService>();
    configService.awsAccessKeyId = 'AKIA_TEST_KEY';
    configService.awsSecretAccessKey = 'test-secret';
    configService.awsBucketName = 'my-bucket';
    configService.awsRegion = 'us-east-1';

    const module = await Test.createTestingModule({
      providers: [
        UploadFileAwsS3AdapterGateway,
        { provide: TOKENS.LoggerGateway, useValue: logger },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    sut = module.get(UploadFileAwsS3AdapterGateway);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('upload', () => {
    describe('Happy path', () => {
      it('should return publicUrl from S3 upload response', async() => {
        // Arrange
        const input = buildInput({ folder: 'client-attachments' });

        // Act
        const result = await sut.upload(input);

        // Assert
        expect(result.publicUrl).toBe('https://my-bucket.s3.amazonaws.com/client-attachments/00000000-0000-0000-0000-000000000001-photo.jpg');
        expect(Upload).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              Bucket: 'my-bucket',
              ContentType: 'image/jpeg',
              Key: 'client-attachments/00000000-0000-0000-0000-000000000001-photo.jpg',
            }),
          }),
        );
        expect(logger.error).not.toHaveBeenCalled();
      });

      it('should build the S3 client with region and credentials from ConfigService', async() => {
        // Arrange
        const input = buildInput();

        // Act
        await sut.upload(input);

        // Assert
        expect(S3).toHaveBeenCalledWith({
          region: 'us-east-1',
          credentials: {
            accessKeyId: 'AKIA_TEST_KEY',
            secretAccessKey: 'test-secret',
          },
        });
      });
    });

    describe('Error path', () => {
      it('should log and throw ExternalApiError when S3 upload rejects', async() => {
        // Arrange
        const failure = new Error('S3 network error');
        mockUploadDone.mockRejectedValueOnce(failure);
        const input = buildInput();

        // Act & Assert
        await expect(sut.upload(input)).rejects.toThrow('Erro ao fazer upload do arquivo');

        expect(logger.error).toHaveBeenCalledWith(LogContext.UPLOAD_FILE, {
          adapter: 'aws-s3',
          action: 'upload',
          fileName: 'photo.jpg',
          fileSize: 4,
          fileType: 'image/jpeg',
          error: failure,
        });
      });

      it('should log and throw ExternalApiError when upload response has no Location', async() => {
        // Arrange
        mockUploadDone.mockResolvedValueOnce({});
        const input = buildInput();

        // Act & Assert
        await expect(sut.upload(input)).rejects.toThrow('Erro ao fazer upload do arquivo');

        expect(logger.error).toHaveBeenCalledWith(LogContext.UPLOAD_FILE, {
          adapter: 'aws-s3',
          action: 'upload',
          fileName: 'photo.jpg',
          fileSize: 4,
          fileType: 'image/jpeg',
          error: expect.any(Error),
        });
      });
    });

    describe('Edge cases', () => {
      it('should build Key without folder prefix when folder is not provided', async() => {
        // Arrange
        const input = buildInput();

        // Act
        await sut.upload(input);

        // Assert
        expect(Upload).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              Key: '00000000-0000-0000-0000-000000000001-photo.jpg',
            }),
          }),
        );
      });
    });
  });

  describe('delete', () => {
    describe('Happy path', () => {
      it('should call S3 delete with key extracted from public URL', async() => {
        // Arrange
        const publicUrl = 'https://my-bucket.s3.amazonaws.com/client-attachments/uuid-old.pdf';

        // Act
        await sut.delete(publicUrl);

        // Assert
        expect(DeleteObjectCommand).toHaveBeenCalledWith({
          Bucket: 'my-bucket',
          Key: 'client-attachments/uuid-old.pdf',
        });
        expect(mockS3Send).toHaveBeenCalledTimes(1);
        expect(logger.error).not.toHaveBeenCalled();
      });
    });

    describe('Error path', () => {
      it('should log and throw ExternalApiError when S3 delete rejects', async() => {
        // Arrange
        const publicUrl = 'https://my-bucket.s3.amazonaws.com/path/file.pdf';
        const failure = new Error('AccessDenied');
        mockS3Send.mockRejectedValueOnce(failure);

        // Act & Assert
        await expect(sut.delete(publicUrl)).rejects.toThrow('Erro ao excluir o arquivo');

        expect(logger.error).toHaveBeenCalledWith(LogContext.UPLOAD_FILE, {
          adapter: 'aws-s3',
          action: 'delete',
          publicUrl,
          fileKey: 'path/file.pdf',
          error: failure,
        });
      });
    });

    describe('Edge cases', () => {
      it('should log and not call S3 send when URL has empty path', async() => {
        // Arrange
        const publicUrl = 'https://my-bucket.s3.amazonaws.com/';

        // Act
        await sut.delete(publicUrl);

        // Assert
        expect(mockS3Send).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(LogContext.UPLOAD_FILE, {
          adapter: 'aws-s3',
          action: 'delete',
          publicUrl,
          error: 'URL do arquivo inválida',
        });
      });

      it('should log and not call S3 send when URL is invalid', async() => {
        // Arrange
        const publicUrl = 'not-a-valid-url';

        // Act
        await sut.delete(publicUrl);

        // Assert
        expect(mockS3Send).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(LogContext.UPLOAD_FILE, {
          adapter: 'aws-s3',
          action: 'delete',
          publicUrl,
          error: 'URL do arquivo inválida',
        });
      });
    });
  });
});
