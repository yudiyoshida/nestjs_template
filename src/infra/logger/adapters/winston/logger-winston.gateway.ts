import { Injectable } from '@nestjs/common';
import { createLogger, format, Logger, transports } from 'winston';
import { ILoggerGateway, LogContext, LogContextDataMap } from '../../logger.gateway';

@Injectable()
export class LoggerWinstonAdapterGateway implements ILoggerGateway {
  private readonly logger: Logger;

  constructor() {
    const fileTransports = Object.values(LogContext).map(context => this.generateTransport(context));
    this.logger = createLogger({ transports: fileTransports });
  }

  public debug<T extends LogContext>(context: T, data: LogContextDataMap[T]): void {
    this.logger.log('debug', { context, data });
  }

  public error<T extends LogContext>(context: T, data: LogContextDataMap[T]): void {
    this.logger.log('error', { context, data });
  }

  private generateTransport(context: LogContext) {
    return new transports.File({
      level: 'debug',
      filename: `logs/${context}.log`,
      format: this.filterByContext(context),
    });
  }

  private filterByContext(context: LogContext) {
    return format.combine(
      format(info => info.context === context ? info : false)(),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.json(),
    );
  }
}
