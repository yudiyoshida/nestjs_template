import { Injectable } from '@nestjs/common';
import { UploadFileInputDto, UploadFileOutputDto } from '../../dtos/upload-file.dto';
import { IUploadFileGateway } from '../../upload-file.gateway';

@Injectable()
export class UploadFileFakeAdapterGateway implements IUploadFileGateway {
  public async upload(_input: UploadFileInputDto): Promise<UploadFileOutputDto> {
    return { publicUrl: 'http://fake-url.com/' + Date.now() };
  }

  public async delete(_publicUrl: string): Promise<void> {}
}
