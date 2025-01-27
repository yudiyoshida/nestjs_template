import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Errors } from 'src/shared/errors/message';
import { IUploadGateway } from '../../gateway/upload.gateway';
import { UploadSingleOutputDto } from './dtos/upload-single.dto';

@Injectable()
export class UploadSingle {
  private TEN_MEGABYTES = 1024 * 1024 * 10;

  constructor(
    @Inject('UploadFileGateway') private uploadGateway: IUploadGateway
  ) {}

  public async execute(file: Express.Multer.File): Promise<UploadSingleOutputDto> {
    if (!file) {
      throw new BadRequestException(Errors.FILE_IS_REQUIRED);
    }
    if (file.size > this.TEN_MEGABYTES) {
      throw new BadRequestException(Errors.FILE_SIZE_EXCEEDED);
    }

    const url = await this.uploadGateway.upload(file);

    return { url };
  }
}
