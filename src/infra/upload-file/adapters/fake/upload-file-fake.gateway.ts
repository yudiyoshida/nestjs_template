/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { UploadFileInput, UploadedFileOutput } from '../../dtos/upload-file.dto';
import { IUploadFileGateway } from '../../upload-file.gateway';

@Injectable()
export class UploadFileFakeAdapterGateway implements IUploadFileGateway {
  public async upload(_input: UploadFileInput): Promise<UploadedFileOutput> {
    return { publicUrl: 'http://fake-url.com/' + Date.now() };
  }

  public async delete(_publicUrl: string): Promise<void> {}
}
