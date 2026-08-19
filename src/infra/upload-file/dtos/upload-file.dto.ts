export class UploadFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeInBytes: number;
  folder?: string;
};

export class UploadedFileOutput {
  publicUrl: string;
};
