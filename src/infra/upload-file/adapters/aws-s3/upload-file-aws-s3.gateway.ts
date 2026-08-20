import { DeleteObjectCommand, S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Inject, Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { type ILoggerGateway, LogContext } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import type { UploadFileInputDto, UploadFileOutputDto } from '../../dtos/upload-file.dto';
import { IUploadFileGateway } from '../../upload-file.gateway';
import type { S3UploadParams } from './dtos/aws-s3.dto';

@Injectable()
export class UploadFileAwsS3AdapterGateway implements IUploadFileGateway {
  private s3: S3;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly configService: ConfigService,
  ) {}

  public async upload(input: UploadFileInputDto): Promise<UploadFileOutputDto> {
    let location: string | undefined;

    try {
      const s3 = await this.getS3Client();

      const s3Response = await new Upload({
        client: s3,
        params: this.toVendor(input),
      }).done();

      location = s3Response.Location;
    }
    catch (error) {
      this.logUploadError(input, error);
      throw new ExternalApiError('Erro ao fazer upload do arquivo');
    }

    if (!location) {
      this.logUploadError(input, 'Resposta do S3 sem Location');
      throw new ExternalApiError('Erro ao fazer upload do arquivo');
    }

    return this.toPort(location);
  }

  public async delete(publicUrl: string): Promise<void> {
    const fileKey = this.getFileKey(publicUrl);
    if (!fileKey) {
      this.logger.error(LogContext.UPLOAD_FILE, {
        adapter: 'aws-s3',
        action: 'delete',
        publicUrl,
        error: 'URL do arquivo inválida',
      });
      throw new ExternalApiError('URL do arquivo inválida');
    }

    try {
      const s3 = await this.getS3Client();

      await s3.send(
        new DeleteObjectCommand({
          Bucket: this.configService.awsBucketName,
          Key: fileKey,
        }),
      );
    }
    catch (error) {
      this.logger.error(LogContext.UPLOAD_FILE, {
        adapter: 'aws-s3',
        action: 'delete',
        publicUrl,
        fileKey,
        error,
      });
      throw new ExternalApiError('Erro ao excluir o arquivo');
    }
  }

  private getFileKey(publicUrl: string): string | null {
    try {
      const u = new URL(publicUrl);
      const path = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
      const key = decodeURIComponent(path);
      return key.length > 0 ? key : null;
    }
    catch {
      return null;
    }
  }

  private async getS3Client(): Promise<S3> {
    if (this.s3) {
      return this.s3;
    }

    this.s3 = new S3({
      region: this.configService.awsRegion,
      credentials: {
        accessKeyId: this.configService.awsAccessKeyId,
        secretAccessKey: this.configService.awsSecretAccessKey,
      },
    });

    return this.s3;
  }

  private logUploadError(input: UploadFileInputDto, error: unknown): void {
    this.logger.error(LogContext.UPLOAD_FILE, {
      adapter: 'aws-s3',
      action: 'upload',
      fileName: input.originalName,
      fileSize: input.sizeInBytes,
      fileType: input.mimeType,
      error,
    });
  }

  private toVendor(input: UploadFileInputDto): S3UploadParams {
    return {
      ACL: 'public-read',
      Body: input.buffer,
      Bucket: this.configService.awsBucketName,
      ContentType: input.mimeType,
      Key: `${input.folder ? input.folder + '/' : ''}${crypto.randomUUID()}-${input.originalName}`,
    };
  }

  private toPort(location: string): UploadFileOutputDto {
    return { publicUrl: location };
  }
}
