import { Injectable } from '@nestjs/common';
import { ILoggerGateway, LogContext, LogContextDataMap } from '../../logger.gateway';

@Injectable()
export class LoggerFakeAdapterGateway implements ILoggerGateway {
  public debug<T extends LogContext>(_context: T, _data: LogContextDataMap[T]): void {}
  public error<T extends LogContext>(_context: T, _data: LogContextDataMap[T]): void {}
}
