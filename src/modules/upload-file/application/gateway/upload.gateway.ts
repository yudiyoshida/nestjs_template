export interface IUploadGateway {
  upload(file: Express.Multer.File): Promise<string>;
}
