export class UploadFileInputDto {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeInBytes: number;
  folder?: string;
}

export class UploadFileOutputDto {
  publicUrl: string;
}
