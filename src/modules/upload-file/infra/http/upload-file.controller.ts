import { Controller, HttpStatus, ParseFileOptions, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Swagger } from 'src/infra/openapi/swagger';
import { UploadArray } from 'src/modules/upload-file/application/usecases/upload-array/upload-array.service';
import { UploadSingleInputDto, UploadSingleOutputDto } from 'src/modules/upload-file/application/usecases/upload-single/dtos/upload-single.dto';
import { UploadSingle } from 'src/modules/upload-file/application/usecases/upload-single/upload-single.service';

const options: ParseFileOptions = {
  errorHttpStatusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
  fileIsRequired: true,
};

@Controller('upload-file')
export class UploadFileController {
  constructor(
    private uploadSingle: UploadSingle,
    private uploadArray: UploadArray,
  ) {}

  @Post('single')
  @Swagger({
    tags: ['Upload de arquivo'],
    summary: 'Upload de um único arquivo',
    okResponse: UploadSingleOutputDto,
  })
  @ApiBody({
    type: UploadSingleInputDto,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  public uploadOne(@UploadedFile(new ParseFilePipe(options)) file: Express.Multer.File): Promise<UploadSingleOutputDto> {
    return this.uploadSingle.execute(file);
  }

  // @Post('array')
  // @Swagger({
  //   tags: ['Upload de arquivo'],
  //   summary: 'Upload de vários arquivos',
  //   okResponse: UploadArrayOutputDto,
  // })
  // @ApiConsumes('multipart/form-data')
  // @UseInterceptors(FilesInterceptor('files'))
  // public uploadMany(@UploadedFiles(new ParseFilePipe(options)) files: Array<Express.Multer.File>): Promise<UploadArrayOutputDto> {
  //   return this.uploadArray.execute(files);
  // }
}
