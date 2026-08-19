import { UploadFileInputDto } from '../../dtos/upload-file.dto';
import { UploadFileFakeAdapterGateway } from './upload-file-fake.gateway';

describe('UploadFileFakeAdapterGateway - Unit tests', () => {
  let sut: UploadFileFakeAdapterGateway;

  beforeEach(() => {
    sut = new UploadFileFakeAdapterGateway();
  });

  describe('upload', () => {
    describe('Happy path', () => {
      it('should resolve a publicUrl starting with the fake host', async() => {
        // Arrange
        const input: UploadFileInputDto = {
          buffer: Buffer.from('file'),
          originalName: 'file.txt',
          mimeType: 'text/plain',
          sizeInBytes: 4,
        };

        // Act
        const result = await sut.upload(input);

        // Assert
        expect(result.publicUrl.startsWith('http://fake-url.com/')).toBe(true);
      });
    });
  });

  describe('delete', () => {
    describe('Happy path', () => {
      it('should resolve without throwing for any publicUrl', async() => {
        // Act & Assert
        await expect(sut.delete('http://fake-url.com/123')).resolves.toBeUndefined();
      });
    });
  });
});
