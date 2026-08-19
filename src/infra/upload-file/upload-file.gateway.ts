import { UploadFileInputDto, UploadFileOutputDto } from './dtos/upload-file.dto';

export interface IUploadFileGateway {
  upload(input: UploadFileInputDto): Promise<UploadFileOutputDto>;
  delete(publicUrl: string): Promise<void>;
}
