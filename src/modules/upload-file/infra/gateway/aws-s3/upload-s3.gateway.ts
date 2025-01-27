import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable } from '@nestjs/common';
import { IUploadGateway } from 'src/modules/upload-file/application/gateway/upload.gateway';

@Injectable()
export class UploadS3AdapterGateway implements IUploadGateway {
  public async upload(file: Express.Multer.File): Promise<string> {
    const s3 = new S3({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
      region: process.env.AWS_REGION as string,
    });

    const s3Response = await new Upload({
      client: s3,
      params: {
        ACL: 'public-read',
        Body: file.buffer,
        Bucket: process.env.AWS_BUCKET_NAME as string,
        ContentType: file.mimetype,
        // ContentDisposition: 'attachment',
        Key: `${crypto.randomUUID()}-${file.originalname}`,
      },
    }).done();

    return s3Response.Location!;
  }
}
