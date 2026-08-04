import { createLogger } from 'winston';
import { LogContext } from '../../logger.gateway';
import { LoggerWinstonAdapterGateway } from './logger-winston.gateway';

jest.mock('winston', () => {
  const actual = jest.requireActual('winston');
  return {
    ...actual,
    createLogger: jest.fn(),
  };
});

describe('LoggerWinstonAdapterGateway - Unit tests', () => {
  let sut: LoggerWinstonAdapterGateway;
  let mockLog: jest.Mock;

  beforeEach(() => {
    mockLog = jest.fn();
    jest.mocked(createLogger).mockReturnValue({ log: mockLog } as any);

    sut = new LoggerWinstonAdapterGateway();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a transport for each LogContext', () => {
    // Assert
    const call = jest.mocked(createLogger).mock.calls[0][0];
    expect(call?.transports).toHaveLength(Object.values(LogContext).length);
  });

  describe('debug', () => {
    it('should log at debug level with context and data', () => {
      // Act
      sut.debug(LogContext.CACHE, { action: 'set', key: 'k' } as any);

      // Assert
      expect(mockLog).toHaveBeenCalledWith('debug', {
        context: LogContext.CACHE,
        data: { action: 'set', key: 'k' },
      });
    });
  });

  describe('error', () => {
    it('should log at error level with context and data', () => {
      // Act
      const error = new Error('boom');
      sut.error(LogContext.SMTP, { action: 'send', body: error } as any);

      // Assert
      expect(mockLog).toHaveBeenCalledWith('error', {
        context: LogContext.SMTP,
        data: { action: 'send', body: error },
      });
    });
  });
});
