import { Injectable } from '@nestjs/common';
import { IUploadGateway } from 'src/modules/upload-file/application/gateway/upload.gateway';

@Injectable()
export class UploadFakeGatewayAdapter implements IUploadGateway {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async upload(file: Express.Multer.File): Promise<string> {
    return 'http://fake-url.com/' + Date.now();
  }
}
