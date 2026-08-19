import { createMock } from '@golevelup/ts-jest';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { Environment } from './environment.enum';

describe('ConfigService - Unit tests', () => {
  let sut: ConfigService;
  let nestConfigService: NestConfigService;

  beforeEach(async() => {
    nestConfigService = createMock<NestConfigService>();

    const module = await Test.createTestingModule({
      providers: [
        ConfigService,
        { provide: NestConfigService, useValue: nestConfigService },
      ],
    }).compile();

    sut = module.get(ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('nodeEnv', () => {
    describe('Happy path', () => {
      it.each([
        Environment.Development,
        Environment.Production,
        Environment.Test,
      ])('should return %s when nestConfigService.get returns that environment', (env: Environment) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(env);

        // Act
        const result = sut.nodeEnv;

        // Assert
        expect(result).toBe(env);
        expect(nestConfigService.get).toHaveBeenCalledWith('NODE_ENV');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing NODE_ENV');
        });

        // Act & Assert
        expect(() => sut.nodeEnv).toThrow('missing NODE_ENV');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        'staging',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.nodeEnv;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('isDevelopment', () => {
    describe('Happy path', () => {
      it('should return true when nodeEnv is Development', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(Environment.Development);

        // Act
        const result = sut.isDevelopment;

        // Assert
        expect(result).toBe(true);
        expect(nestConfigService.get).toHaveBeenCalledWith('NODE_ENV');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing NODE_ENV');
        });

        // Act & Assert
        expect(() => sut.isDevelopment).toThrow('missing NODE_ENV');
      });
    });

    describe('Edge cases', () => {
      it.each([
        Environment.Production,
        Environment.Test,
        undefined,
        null,
        '',
        'staging',
      ])('should return false when nodeEnv is %s', (env: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(env);

        // Act
        const result = sut.isDevelopment;

        // Assert
        expect(result).toBe(false);
      });
    });
  });

  describe('isProduction', () => {
    describe('Happy path', () => {
      it('should return true when nodeEnv is Production', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(Environment.Production);

        // Act
        const result = sut.isProduction;

        // Assert
        expect(result).toBe(true);
        expect(nestConfigService.get).toHaveBeenCalledWith('NODE_ENV');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing NODE_ENV');
        });

        // Act & Assert
        expect(() => sut.isProduction).toThrow('missing NODE_ENV');
      });
    });

    describe('Edge cases', () => {
      it.each([
        Environment.Development,
        Environment.Test,
        undefined,
        null,
        '',
        'staging',
      ])('should return false when nodeEnv is %s', (env: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(env);

        // Act
        const result = sut.isProduction;

        // Assert
        expect(result).toBe(false);
      });
    });
  });

  describe('isTest', () => {
    describe('Happy path', () => {
      it('should return true when nodeEnv is Test', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(Environment.Test);

        // Act
        const result = sut.isTest;

        // Assert
        expect(result).toBe(true);
        expect(nestConfigService.get).toHaveBeenCalledWith('NODE_ENV');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing NODE_ENV');
        });

        // Act & Assert
        expect(() => sut.isTest).toThrow('missing NODE_ENV');
      });
    });

    describe('Edge cases', () => {
      it.each([
        Environment.Development,
        Environment.Production,
        undefined,
        null,
        '',
        'staging',
      ])('should return false when nodeEnv is %s', (env: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(env);

        // Act
        const result = sut.isTest;

        // Assert
        expect(result).toBe(false);
      });
    });
  });

  describe('port', () => {
    describe('Happy path', () => {
      it('should return the port when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(3000);

        // Act
        const result = sut.port;

        // Assert
        expect(result).toBe(3000);
        expect(nestConfigService.get).toHaveBeenCalledWith('PORT');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing PORT');
        });

        // Act & Assert
        expect(() => sut.port).toThrow('missing PORT');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        0,
        -1,
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.port;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('sslKeyPath', () => {
    describe('Happy path', () => {
      it('should return the ssl key path when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('/path/key.pem');

        // Act
        const result = sut.sslKeyPath;

        // Assert
        expect(result).toBe('/path/key.pem');
        expect(nestConfigService.get).toHaveBeenCalledWith('SSL_KEY');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing SSL_KEY');
        });

        // Act & Assert
        expect(() => sut.sslKeyPath).toThrow('missing SSL_KEY');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.sslKeyPath;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('sslCertPath', () => {
    describe('Happy path', () => {
      it('should return the ssl cert path when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('/path/cert.pem');

        // Act
        const result = sut.sslCertPath;

        // Assert
        expect(result).toBe('/path/cert.pem');
        expect(nestConfigService.get).toHaveBeenCalledWith('SSL_CERT');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing SSL_CERT');
        });

        // Act & Assert
        expect(() => sut.sslCertPath).toThrow('missing SSL_CERT');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.sslCertPath;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('sslCaPath', () => {
    describe('Happy path', () => {
      it('should return the ssl ca path when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('/path/ca.pem');

        // Act
        const result = sut.sslCaPath;

        // Assert
        expect(result).toBe('/path/ca.pem');
        expect(nestConfigService.get).toHaveBeenCalledWith('SSL_CA');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing SSL_CA');
        });

        // Act & Assert
        expect(() => sut.sslCaPath).toThrow('missing SSL_CA');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.sslCaPath;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('corsOrigin', () => {
    describe('Happy path', () => {
      it('should return the cors origin when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('https://example.com');

        // Act
        const result = sut.corsOrigin;

        // Assert
        expect(result).toBe('https://example.com');
        expect(nestConfigService.get).toHaveBeenCalledWith('CORS_ORIGIN');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing CORS_ORIGIN');
        });

        // Act & Assert
        expect(() => sut.corsOrigin).toThrow('missing CORS_ORIGIN');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
        '*',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.corsOrigin;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('jwtSecret', () => {
    describe('Happy path', () => {
      it('should return the jwt secret when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('jwt-secret');

        // Act
        const result = sut.jwtSecret;

        // Assert
        expect(result).toBe('jwt-secret');
        expect(nestConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing JWT_SECRET');
        });

        // Act & Assert
        expect(() => sut.jwtSecret).toThrow('missing JWT_SECRET');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.jwtSecret;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('jwtExpiresIn', () => {
    describe('Happy path', () => {
      it('should return the jwt expires in when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('1h');

        // Act
        const result = sut.jwtExpiresIn;

        // Assert
        expect(result).toBe('1h');
        expect(nestConfigService.get).toHaveBeenCalledWith('JWT_EXPIRES_IN');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing JWT_EXPIRES_IN');
        });

        // Act & Assert
        expect(() => sut.jwtExpiresIn).toThrow('missing JWT_EXPIRES_IN');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.jwtExpiresIn;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('refreshTokenSecret', () => {
    describe('Happy path', () => {
      it('should return the refresh token secret when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('refresh-secret');

        // Act
        const result = sut.refreshTokenSecret;

        // Assert
        expect(result).toBe('refresh-secret');
        expect(nestConfigService.get).toHaveBeenCalledWith('REFRESH_TOKEN_SECRET');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing REFRESH_TOKEN_SECRET');
        });

        // Act & Assert
        expect(() => sut.refreshTokenSecret).toThrow('missing REFRESH_TOKEN_SECRET');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.refreshTokenSecret;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('refreshTokenExpiresIn', () => {
    describe('Happy path', () => {
      it('should return the refresh token expires in when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(604800);

        // Act
        const result = sut.refreshTokenExpiresIn;

        // Assert
        expect(result).toBe(604800);
        expect(nestConfigService.get).toHaveBeenCalledWith('REFRESH_TOKEN_EXPIRES_IN');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing REFRESH_TOKEN_EXPIRES_IN');
        });

        // Act & Assert
        expect(() => sut.refreshTokenExpiresIn).toThrow('missing REFRESH_TOKEN_EXPIRES_IN');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        0,
        -1,
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.refreshTokenExpiresIn;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('databaseUrl', () => {
    describe('Happy path', () => {
      it('should return the database url when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('postgres://localhost:5432/db');

        // Act
        const result = sut.databaseUrl;

        // Assert
        expect(result).toBe('postgres://localhost:5432/db');
        expect(nestConfigService.get).toHaveBeenCalledWith('DATABASE_URL');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing DATABASE_URL');
        });

        // Act & Assert
        expect(() => sut.databaseUrl).toThrow('missing DATABASE_URL');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.databaseUrl;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('awsAccessKeyId', () => {
    describe('Happy path', () => {
      it('should return the aws access key id when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('access-key-id');

        // Act
        const result = sut.awsAccessKeyId;

        // Assert
        expect(result).toBe('access-key-id');
        expect(nestConfigService.get).toHaveBeenCalledWith('AWS_ACCESS_KEY_ID');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing AWS_ACCESS_KEY_ID');
        });

        // Act & Assert
        expect(() => sut.awsAccessKeyId).toThrow('missing AWS_ACCESS_KEY_ID');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.awsAccessKeyId;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('awsSecretAccessKey', () => {
    describe('Happy path', () => {
      it('should return the aws secret access key when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('secret-access-key');

        // Act
        const result = sut.awsSecretAccessKey;

        // Assert
        expect(result).toBe('secret-access-key');
        expect(nestConfigService.get).toHaveBeenCalledWith('AWS_SECRET_ACCESS_KEY');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing AWS_SECRET_ACCESS_KEY');
        });

        // Act & Assert
        expect(() => sut.awsSecretAccessKey).toThrow('missing AWS_SECRET_ACCESS_KEY');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.awsSecretAccessKey;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('awsRegion', () => {
    describe('Happy path', () => {
      it('should return the aws region when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('us-east-1');

        // Act
        const result = sut.awsRegion;

        // Assert
        expect(result).toBe('us-east-1');
        expect(nestConfigService.get).toHaveBeenCalledWith('AWS_REGION');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing AWS_REGION');
        });

        // Act & Assert
        expect(() => sut.awsRegion).toThrow('missing AWS_REGION');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.awsRegion;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('awsBucketName', () => {
    describe('Happy path', () => {
      it('should return the aws bucket name when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('my-bucket');

        // Act
        const result = sut.awsBucketName;

        // Assert
        expect(result).toBe('my-bucket');
        expect(nestConfigService.get).toHaveBeenCalledWith('AWS_BUCKET_NAME');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing AWS_BUCKET_NAME');
        });

        // Act & Assert
        expect(() => sut.awsBucketName).toThrow('missing AWS_BUCKET_NAME');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.awsBucketName;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('smtpHost', () => {
    describe('Happy path', () => {
      it('should return the smtp host when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('smtp.example.com');

        // Act
        const result = sut.smtpHost;

        // Assert
        expect(result).toBe('smtp.example.com');
        expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_HOST');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing SMTP_HOST');
        });

        // Act & Assert
        expect(() => sut.smtpHost).toThrow('missing SMTP_HOST');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.smtpHost;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('smtpPort', () => {
    describe('Happy path', () => {
      it('should return the smtp port when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(587);

        // Act
        const result = sut.smtpPort;

        // Assert
        expect(result).toBe(587);
        expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_PORT');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing SMTP_PORT');
        });

        // Act & Assert
        expect(() => sut.smtpPort).toThrow('missing SMTP_PORT');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        0,
        -1,
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.smtpPort;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('smtpTo', () => {
    describe('Happy path', () => {
      it('should return the smtp to when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('to@example.com');

        // Act
        const result = sut.smtpTo;

        // Assert
        expect(result).toBe('to@example.com');
        expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_TO');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing SMTP_TO');
        });

        // Act & Assert
        expect(() => sut.smtpTo).toThrow('missing SMTP_TO');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.smtpTo;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('smtpFrom', () => {
    describe('Happy path', () => {
      it('should return the smtp from when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('from@example.com');

        // Act
        const result = sut.smtpFrom;

        // Assert
        expect(result).toBe('from@example.com');
        expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_FROM');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing SMTP_FROM');
        });

        // Act & Assert
        expect(() => sut.smtpFrom).toThrow('missing SMTP_FROM');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.smtpFrom;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('smtpUsername', () => {
    describe('Happy path', () => {
      it('should return the smtp username when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('smtp-user');

        // Act
        const result = sut.smtpUsername;

        // Assert
        expect(result).toBe('smtp-user');
        expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_USERNAME');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing SMTP_USERNAME');
        });

        // Act & Assert
        expect(() => sut.smtpUsername).toThrow('missing SMTP_USERNAME');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.smtpUsername;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('smtpPassword', () => {
    describe('Happy path', () => {
      it('should return the smtp password when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('smtp-password');

        // Act
        const result = sut.smtpPassword;

        // Assert
        expect(result).toBe('smtp-password');
        expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_PASSWORD');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing SMTP_PASSWORD');
        });

        // Act & Assert
        expect(() => sut.smtpPassword).toThrow('missing SMTP_PASSWORD');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.smtpPassword;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('redisUrl', () => {
    describe('Happy path', () => {
      it('should return the redis url when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('redis://localhost:6379');

        // Act
        const result = sut.redisUrl;

        // Assert
        expect(result).toBe('redis://localhost:6379');
        expect(nestConfigService.get).toHaveBeenCalledWith('REDIS_URL');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing REDIS_URL');
        });

        // Act & Assert
        expect(() => sut.redisUrl).toThrow('missing REDIS_URL');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.redisUrl;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('viacepApiUrl', () => {
    describe('Happy path', () => {
      it('should return the viacep api url when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('https://viacep.com.br/ws');

        // Act
        const result = sut.viacepApiUrl;

        // Assert
        expect(result).toBe('https://viacep.com.br/ws');
        expect(nestConfigService.get).toHaveBeenCalledWith('VIACEP_API_URL');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing VIACEP_API_URL');
        });

        // Act & Assert
        expect(() => sut.viacepApiUrl).toThrow('missing VIACEP_API_URL');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.viacepApiUrl;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('cnpjaApiUrl', () => {
    describe('Happy path', () => {
      it('should return the cnpja api url when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('https://api.cnpja.com');

        // Act
        const result = sut.cnpjaApiUrl;

        // Assert
        expect(result).toBe('https://api.cnpja.com');
        expect(nestConfigService.get).toHaveBeenCalledWith('CNPJA_API_URL');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing CNPJA_API_URL');
        });

        // Act & Assert
        expect(() => sut.cnpjaApiUrl).toThrow('missing CNPJA_API_URL');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.cnpjaApiUrl;

        // Assert
        expect(result).toBe(value);
      });
    });
  });

  describe('cnpjaApiKey', () => {
    describe('Happy path', () => {
      it('should return the cnpja api key when nestConfigService.get returns it', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue('test-cnpja-api-key');

        // Act
        const result = sut.cnpjaApiKey;

        // Assert
        expect(result).toBe('test-cnpja-api-key');
        expect(nestConfigService.get).toHaveBeenCalledWith('CNPJA_API_KEY');
      });
    });

    describe('Error path', () => {
      it('should propagate when nestConfigService.get throws', () => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockImplementation(() => {
          throw new Error('missing CNPJA_API_KEY');
        });

        // Act & Assert
        expect(() => sut.cnpjaApiKey).toThrow('missing CNPJA_API_KEY');
      });
    });

    describe('Edge cases', () => {
      it.each([
        undefined,
        null,
        '',
        '           ',
      ])('should return %s when nestConfigService.get returns that value', (value: unknown) => {
        // Arrange
        jest.spyOn(nestConfigService, 'get').mockReturnValue(value);

        // Act
        const result = sut.cnpjaApiKey;

        // Assert
        expect(result).toBe(value);
      });
    });
  });
});
