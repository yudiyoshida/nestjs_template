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

const getFileTransports = (): any[] => {
  const options = jest.mocked(createLogger).mock.calls[0][0];
  return options?.transports as any[];
};

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

  describe('constructor', () => {
    describe('Happy path', () => {
      it('should create one file transport for each LogContext', () => {
        // Act
        const fileTransports = getFileTransports();

        // Assert
        expect(fileTransports).toHaveLength(Object.values(LogContext).length);
      });

      it('should configure each transport with debug level and the context log file', () => {
        // Act
        const fileTransports = getFileTransports();

        // Assert
        expect(fileTransports.map(transport => ({
          level: transport.level,
          dirname: transport.dirname,
          filename: transport.filename,
        }))).toEqual(Object.values(LogContext).map(context => ({
          level: 'debug',
          dirname: 'logs',
          filename: `${context}.log`,
        })));
      });

      it('should keep the log entry when the context matches the transport', () => {
        // Arrange
        const [httpTransport] = getFileTransports();

        // Act
        const result = httpTransport.format.transform(
          { level: 'debug', context: LogContext.HTTP },
          httpTransport.format.options,
        );

        // Assert
        expect(result).toMatchObject({ level: 'debug', context: LogContext.HTTP });
      });
    });

    describe('Error path', () => {
      it('should propagate when createLogger throws', () => {
        // Arrange
        jest.mocked(createLogger).mockImplementationOnce(() => {
          throw new Error('winston down');
        });

        // Act & Assert
        expect(() => new LoggerWinstonAdapterGateway()).toThrow('winston down');
      });
    });

    describe('Edge cases', () => {
      it('should drop the log entry when the context does not match the transport', () => {
        // Arrange
        const [httpTransport] = getFileTransports();

        // Act
        const result = httpTransport.format.transform(
          { level: 'debug', context: LogContext.CACHE },
          httpTransport.format.options,
        );

        // Assert
        expect(result).toBe(false);
      });
    });
  });

  describe('debug', () => {
    describe('Happy path', () => {
      it('should log at debug level with context and data', () => {
        // Act
        sut.debug(LogContext.CACHE, { action: 'set', key: 'k' });

        // Assert
        expect(mockLog).toHaveBeenCalledTimes(1);
        expect(mockLog).toHaveBeenCalledWith('debug', {
          context: LogContext.CACHE,
          data: { action: 'set', key: 'k' },
        });
      });
    });

    describe('Error path', () => {
      it('should propagate when the underlying logger throws', () => {
        // Arrange
        mockLog.mockImplementation(() => {
          throw new Error('write failed');
        });

        // Act & Assert
        expect(() => sut.debug(LogContext.CACHE, { action: 'set', key: 'k' })).toThrow('write failed');
      });
    });

    describe('Edge cases', () => {
      it('should forward the common data fields untouched', () => {
        // Arrange
        const error = new Error('boom');

        // Act
        sut.debug(LogContext.CEP_LOOKUP, {
          accountId: 'account-id',
          adapter: 'viacep',
          error,
          cep: '01001000',
        });

        // Assert
        expect(mockLog).toHaveBeenCalledWith('debug', {
          context: LogContext.CEP_LOOKUP,
          data: {
            accountId: 'account-id',
            adapter: 'viacep',
            error,
            cep: '01001000',
          },
        });
      });
    });
  });

  describe('error', () => {
    describe('Happy path', () => {
      it('should log at error level with context and data', () => {
        // Arrange
        const error = new Error('boom');

        // Act
        sut.error(LogContext.SMTP, { action: 'send', body: error });

        // Assert
        expect(mockLog).toHaveBeenCalledTimes(1);
        expect(mockLog).toHaveBeenCalledWith('error', {
          context: LogContext.SMTP,
          data: { action: 'send', body: error },
        });
      });
    });

    describe('Error path', () => {
      it('should propagate when the underlying logger throws', () => {
        // Arrange
        mockLog.mockImplementation(() => {
          throw new Error('write failed');
        });

        // Act & Assert
        expect(() => sut.error(LogContext.SMTP, { action: 'send', body: 'body' })).toThrow('write failed');
      });
    });
  });
});
