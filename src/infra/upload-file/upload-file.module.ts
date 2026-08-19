import { DynamicModule, ForwardReference, Module, Provider, Type } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { isUploadFileVendor, UploadFileVendor } from 'src/infra/infra-vendors';
import { TOKENS } from 'src/core/di/token';
import { UploadFileAwsS3AdapterGateway } from './adapters/aws-s3/upload-file-aws-s3.gateway';
import { UploadFileFakeAdapterGateway } from './adapters/fake/upload-file-fake.gateway';
import { IUploadFileGateway } from './upload-file.gateway';

type UploadFileAdapterBinding = {
  class: Type<IUploadFileGateway>;
  modules: Array<Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  providers: Provider[];
};

const UPLOAD_FILE_ADAPTERS: Record<UploadFileVendor, UploadFileAdapterBinding> = {
  [UploadFileVendor.Fake]: {
    class: UploadFileFakeAdapterGateway,
    modules: [],
    providers: [],
  },
  [UploadFileVendor.AwsS3]: {
    class: UploadFileAwsS3AdapterGateway,
    modules: [ConfigModule],
    providers: [],
  },
};

@Module({})
export class UploadFileModule {
  static register(): DynamicModule {
    const vendor = process.env.NODE_ENV === Environment.Test
      ? UploadFileVendor.Fake
      : process.env.UPLOAD_FILE_VENDOR;
    const binding = isUploadFileVendor(vendor)
      ? UPLOAD_FILE_ADAPTERS[vendor]
      : undefined;

    if (!binding) {
      throw new Error(`Invalid UPLOAD_FILE_VENDOR "${vendor ?? ''}"`);
    }

    return {
      module: UploadFileModule,
      imports: [
        ...binding.modules,
      ],
      providers: [
        ...binding.providers,
        {
          provide: TOKENS.UploadFileGateway,
          useClass: binding.class,
        },
      ],
      exports: [
        TOKENS.UploadFileGateway,
      ],
    };
  }
}
