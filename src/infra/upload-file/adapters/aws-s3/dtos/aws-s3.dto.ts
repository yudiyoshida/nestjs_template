export type S3UploadParams = {
  ACL: 'public-read';
  Body: Buffer;
  Bucket: string;
  ContentType: string;
  Key: string;
};
