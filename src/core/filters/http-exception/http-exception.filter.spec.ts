import { createMock } from '@golevelup/ts-jest';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request, Response } from 'express';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { AppException } from '../app.exception';
import { HttpExceptionFilter } from './http-exception.filter';

function makeRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: 'POST',
    url: '/accounts',
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as Request;
}

function makeResponse(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
}

describe('HttpExceptionFilter - Unit tests', () => {
  let sut: HttpExceptionFilter;
  let logger: ILoggerGateway;
  let request: Request;
  let response: Response;
  let host: ArgumentsHost;

  beforeEach(async() => {
    logger = createMock<ILoggerGateway>();
    request = makeRequest();
    response = makeResponse();
    host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;

    const module = await Test.createTestingModule({
      providers: [
        HttpExceptionFilter,
        { provide: TOKENS.LoggerGateway, useValue: logger },
      ],
    }).compile();

    sut = module.get(HttpExceptionFilter);
  });

  describe('Happy path', () => {
    it('should log the http data with the accountId extracted from the authenticated user', () => {
      // Arrange
      const exception = new AppException('erro de validação', HttpStatus.CONFLICT);
      request = makeRequest({ user: { sub: 'account-id' } as any });

      // Act
      sut.catch(exception, host);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.HTTP, {
        accountId: 'account-id',
        method: request.method,
        url: request.url,
        body: {},
        params: {},
        query: {},
        statusCode: HttpStatus.CONFLICT,
        error: 'erro de validação',
      });
    });

    it('should respond with the exception status code and message', () => {
      // Arrange
      const exception = new AppException('erro de validação', HttpStatus.CONFLICT);

      // Act
      sut.catch(exception, host);

      // Assert
      expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(response.json).toHaveBeenCalledWith({ message: 'erro de validação' });
    });
  });

  describe('Edge cases', () => {
    it('should default the response and logged status code to BAD_REQUEST when the exception has no code', () => {
      // Arrange
      const exception = new AppException('erro sem código');

      // Act
      sut.catch(exception, host);

      // Assert
      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(logger.error).toHaveBeenCalledWith(LogContext.HTTP, expect.objectContaining({ statusCode: HttpStatus.BAD_REQUEST }));
    });

    it('should default accountId to undefined when the request has no user', () => {
      // Arrange
      const exception = new AppException('erro de validação', HttpStatus.CONFLICT);

      // Act
      sut.catch(exception, host);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.HTTP, expect.objectContaining({ accountId: undefined }));
    });

    it('should mask the password field in the logged body', () => {
      // Arrange
      const exception = new AppException('erro de validação', HttpStatus.CONFLICT);
      request = makeRequest({ body: { email: 'a@a.com', password: '123456' } });

      // Act
      sut.catch(exception, host);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.HTTP, expect.objectContaining({
        body: { email: 'a@a.com', password: '****' },
      }));
    });

    it.each([
      'password',
      'Password',
      'PASSWORD',
    ])('should mask the password field regardless of casing (%s)', (field: string) => {
      // Arrange
      const exception = new AppException('erro de validação', HttpStatus.CONFLICT);
      request = makeRequest({ body: { [field]: 'secret' } });

      // Act
      sut.catch(exception, host);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.HTTP, expect.objectContaining({
        body: { [field]: '****' },
      }));
    });

    it.each([
      'passwordResetToken',
      'refreshToken',
      'accessToken',
      'credential',
      'code',
      'document',
    ])('should mask the %s field in the logged body', (field: string) => {
      // Arrange
      const exception = new AppException('erro de validação', HttpStatus.CONFLICT);
      request = makeRequest({ body: { email: 'a@a.com', [field]: 'valor-sensivel' } });

      // Act
      sut.catch(exception, host);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.HTTP, expect.objectContaining({
        body: { email: 'a@a.com', [field]: '****' },
      }));
    });

    it('should mask multiple different sensitive fields present in the same body', () => {
      // Arrange
      const exception = new AppException('erro de validação', HttpStatus.CONFLICT);
      request = makeRequest({
        body: {
          password: '123456',
          refreshToken: 'rt-abc',
          accessToken: 'at-abc',
          document: '82067053094',
          email: 'a@a.com',
        },
      });

      // Act
      sut.catch(exception, host);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.HTTP, expect.objectContaining({
        body: {
          password: '****',
          refreshToken: '****',
          accessToken: '****',
          document: '****',
          email: 'a@a.com',
        },
      }));
    });

    it('should not mask fields that are not sensitive', () => {
      // Arrange
      const exception = new AppException('erro de validação', HttpStatus.CONFLICT);
      request = makeRequest({ body: { email: 'a@a.com', name: 'foo' } });

      // Act
      sut.catch(exception, host);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.HTTP, expect.objectContaining({
        body: { email: 'a@a.com', name: 'foo' },
      }));
    });

    it('should sanitize nested objects deeply', () => {
      // Arrange
      const exception = new AppException('erro de validação', HttpStatus.CONFLICT);
      request = makeRequest({ body: { user: { password: '123456', name: 'foo' } } });

      // Act
      sut.catch(exception, host);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.HTTP, expect.objectContaining({
        body: { user: { password: '****', name: 'foo' } },
      }));
    });

    it('should sanitize arrays of objects', () => {
      // Arrange
      const exception = new AppException('erro de validação', HttpStatus.CONFLICT);
      request = makeRequest({ body: [{ password: '123456' }, { password: '654321' }] });

      // Act
      sut.catch(exception, host);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.HTTP, expect.objectContaining({
        body: [{ password: '****' }, { password: '****' }],
      }));
    });

    it('should keep the body unchanged when it is not an object or array', () => {
      // Arrange
      const exception = new AppException('erro de validação', HttpStatus.CONFLICT);
      request = makeRequest({ body: null });

      // Act
      sut.catch(exception, host);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.HTTP, expect.objectContaining({ body: null }));
    });

    it('should keep an empty body object unchanged', () => {
      // Arrange
      const exception = new AppException('erro de validação', HttpStatus.CONFLICT);
      request = makeRequest({ body: {} });

      // Act
      sut.catch(exception, host);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.HTTP, expect.objectContaining({ body: {} }));
    });
  });
});
