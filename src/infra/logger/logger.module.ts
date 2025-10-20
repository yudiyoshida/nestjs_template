import { DynamicModule, Global, Module } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { LoggerFakeAdapterGateway } from './adapters/fake/logger-fake.gateway';
import { LoggerWinstonAdapterGateway } from './adapters/winston/logger-winston.gateway';
import { ConfigModule } from 'src/core/config/config.module';
import { ConfigService } from 'src/core/config/config.service';

@Global()
@Module({})
export class LoggerModule {
  static forRoot(): DynamicModule {
    return {
      module: LoggerModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: TOKENS.LoggerGateway,
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            return configService.isTest
              ? new LoggerFakeAdapterGateway()
              : new LoggerWinstonAdapterGateway();
          },
        },
      ],
    };
  }
}
