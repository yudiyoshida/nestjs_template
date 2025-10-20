import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule.forRoot(),
  ],
  exports: [
    DatabaseModule,
    LoggerModule,
  ],
})
export class InfraModule {}
