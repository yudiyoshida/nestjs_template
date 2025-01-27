import { Module } from '@nestjs/common';
import { PrismaModule } from './infra/database/prisma.module';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { FaqModule } from './modules/faq/faq.module';
import { TextModule } from './modules/text/text.module';
import { UploadFileModule } from './modules/upload-file/upload-file.module';

@Module({
  imports: [
    PrismaModule,
    AuthenticationModule,
    FaqModule,
    TextModule,
    UploadFileModule,
  ],
})
export class AppModule {}
