import { Module } from '@nestjs/common';
import { UploadArray } from './application/usecases/upload-array/upload-array.service';
import { UploadSingle } from './application/usecases/upload-single/upload-single.service';
import { UploadS3AdapterGateway } from './infra/gateway/aws-s3/upload-s3.gateway';
import { UploadFileController } from './infra/http/upload-file.controller';

@Module({
  controllers: [
    UploadFileController,
  ],
  providers: [
    UploadSingle,
    UploadArray,
    {
      provide: 'UploadFileGateway',
      useClass: UploadS3AdapterGateway,
    },
  ],
})
export class UploadFileModule {}
