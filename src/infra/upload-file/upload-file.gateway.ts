import { UploadFileInput, UploadedFileOutput } from './dtos/upload-file.dto';

export interface IUploadFileGateway {
  upload(input: UploadFileInput): Promise<UploadedFileOutput>;
  delete(publicUrl: string): Promise<void>;
}
