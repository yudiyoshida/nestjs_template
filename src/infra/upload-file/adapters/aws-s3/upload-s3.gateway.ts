import { DeleteObjectCommand, S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Inject, Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { type ILoggerGateway, LogContext } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import type { UploadFileInput, UploadedFileOutput } from '../../dtos/upload-file.dto';
import { IUploadFileGateway } from '../../upload-file.gateway';

type S3UploadParams = {
  ACL: 'public-read';
  Body: Buffer;
  Bucket: string;
  ContentType: string;
  Key: string;
};

@Injectable()
export class UploadS3AdapterGateway implements IUploadFileGateway {
  private s3: S3;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly configService: ConfigService,
  ) {}

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
      credentials: {
        accessKeyId: this.configService.awsAccessKeyId,
        secretAccessKey: this.configService.awsSecretAccessKey,
      },
    });

    return this.s3;
  }

  private toVendor(input: UploadFileInput): S3UploadParams {
    return {
      ACL: 'public-read',
      Body: input.buffer,
      Bucket: this.configService.awsBucketName,
      ContentType: input.mimeType,
      Key: `${input.folder ? input.folder + '/' : ''}${crypto.randomUUID()}-${input.originalName}`,
    };
  }

  private toPort(location: string | undefined): UploadedFileOutput {
    if (!location) {
      throw new ExternalApiError('Erro ao fazer upload do arquivo');
    }

    return { publicUrl: location };
  }

  public async upload(input: UploadFileInput): Promise<UploadedFileOutput> {
    try {
      const s3 = await this.getS3Client();
      const params = this.toVendor(input);

      const s3Response = await new Upload({
        client: s3,
        params,
      }).done();

      return this.toPort(s3Response.Location);
    }
    catch (error) {
      this.logger.error(LogContext.UPLOAD_FILE, {
        adapter: 's3',
        action: 'upload',
        fileName: input.originalName,
        fileSize: input.sizeInBytes,
        fileType: input.mimeType,
        error,
      });
      throw new ExternalApiError('Erro ao fazer upload do arquivo');
    }
  }

  public async delete(publicUrl: string): Promise<void> {
    const fileKey = this.getFileKey(publicUrl);
    if (!fileKey) {
      return;
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
        adapter: 's3',
        action: 'delete',
        publicUrl,
        fileKey,
        error,
      });
      throw new ExternalApiError('Erro ao excluir o arquivo');
    }
  }
}
