import { ConfigService as NestConfigService } from '@nestjs/config';
import { ConfigService } from './config.service';
import { Environment } from './environment.enum';

describe('ConfigService - Unit tests', () => {
  let sut: ConfigService;
  let nestConfigService: jest.Mocked<NestConfigService>;

  beforeEach(() => {
    nestConfigService = { get: jest.fn() } as any;
    sut = new ConfigService(nestConfigService);
  });

  describe('Happy path', () => {
    it('should return nodeEnv from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue(Environment.Production);

      // Act
      const result = sut.nodeEnv;

      // Assert
      expect(result).toBe(Environment.Production);
      expect(nestConfigService.get).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should return true for isDevelopment when nodeEnv is Development', () => {
      // Arrange
      nestConfigService.get.mockReturnValue(Environment.Development);

      // Act
      const result = sut.isDevelopment;

      // Assert
      expect(result).toBe(true);
    });

    it.each([
      Environment.Production,
      Environment.Test,
    ])('should return false for isDevelopment when nodeEnv is %s', (env: Environment) => {
      // Arrange
      nestConfigService.get.mockReturnValue(env);

      // Act
      const result = sut.isDevelopment;

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for isProduction when nodeEnv is Production', () => {
      // Arrange
      nestConfigService.get.mockReturnValue(Environment.Production);

      // Act
      const result = sut.isProduction;

      // Assert
      expect(result).toBe(true);
    });

    it.each([
      Environment.Development,
      Environment.Test,
    ])('should return false for isProduction when nodeEnv is %s', (env: Environment) => {
      // Arrange
      nestConfigService.get.mockReturnValue(env);

      // Act
      const result = sut.isProduction;

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for isTest when nodeEnv is Test', () => {
      // Arrange
      nestConfigService.get.mockReturnValue(Environment.Test);

      // Act
      const result = sut.isTest;

      // Assert
      expect(result).toBe(true);
    });

    it.each([
      Environment.Development,
      Environment.Production,
    ])('should return false for isTest when nodeEnv is %s', (env: Environment) => {
      // Arrange
      nestConfigService.get.mockReturnValue(env);

      // Act
      const result = sut.isTest;

      // Assert
      expect(result).toBe(false);
    });

    it('should return port from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue(3000);

      // Act
      const result = sut.port;

      // Assert
      expect(result).toBe(3000);
      expect(nestConfigService.get).toHaveBeenCalledWith('PORT');
    });

    it('should return sslKeyPath from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('/path/key.pem');

      // Act
      const result = sut.sslKeyPath;

      // Assert
      expect(result).toBe('/path/key.pem');
      expect(nestConfigService.get).toHaveBeenCalledWith('SSL_KEY');
    });

    it('should return sslCertPath from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('/path/cert.pem');

      // Act
      const result = sut.sslCertPath;

      // Assert
      expect(result).toBe('/path/cert.pem');
      expect(nestConfigService.get).toHaveBeenCalledWith('SSL_CERT');
    });

    it('should return sslCaPath from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('/path/ca.pem');

      // Act
      const result = sut.sslCaPath;

      // Assert
      expect(result).toBe('/path/ca.pem');
      expect(nestConfigService.get).toHaveBeenCalledWith('SSL_CA');
    });

    it('should return corsOrigin from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('https://example.com');

      // Act
      const result = sut.corsOrigin;

      // Assert
      expect(result).toBe('https://example.com');
      expect(nestConfigService.get).toHaveBeenCalledWith('CORS_ORIGIN');
    });

    it('should return jwtSecret from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('jwt-secret');

      // Act
      const result = sut.jwtSecret;

      // Assert
      expect(result).toBe('jwt-secret');
      expect(nestConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should return jwtExpiresIn from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('1h');

      // Act
      const result = sut.jwtExpiresIn;

      // Assert
      expect(result).toBe('1h');
      expect(nestConfigService.get).toHaveBeenCalledWith('JWT_EXPIRES_IN');
    });

    it('should return refreshTokenSecret from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('refresh-secret');

      // Act
      const result = sut.refreshTokenSecret;

      // Assert
      expect(result).toBe('refresh-secret');
      expect(nestConfigService.get).toHaveBeenCalledWith('REFRESH_TOKEN_SECRET');
    });

    it('should return refreshTokenExpiresIn from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue(604800);

      // Act
      const result = sut.refreshTokenExpiresIn;

      // Assert
      expect(result).toBe(604800);
      expect(nestConfigService.get).toHaveBeenCalledWith('REFRESH_TOKEN_EXPIRES_IN');
    });

    it('should return databaseUrl from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('postgres://localhost:5432/db');

      // Act
      const result = sut.databaseUrl;

      // Assert
      expect(result).toBe('postgres://localhost:5432/db');
      expect(nestConfigService.get).toHaveBeenCalledWith('DATABASE_URL');
    });

    it('should return awsAccessKeyId from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('access-key-id');

      // Act
      const result = sut.awsAccessKeyId;

      // Assert
      expect(result).toBe('access-key-id');
      expect(nestConfigService.get).toHaveBeenCalledWith('AWS_ACCESS_KEY_ID');
    });

    it('should return awsSecretAccessKey from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('secret-access-key');

      // Act
      const result = sut.awsSecretAccessKey;

      // Assert
      expect(result).toBe('secret-access-key');
      expect(nestConfigService.get).toHaveBeenCalledWith('AWS_SECRET_ACCESS_KEY');
    });

    it('should return awsRegion from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('us-east-1');

      // Act
      const result = sut.awsRegion;

      // Assert
      expect(result).toBe('us-east-1');
      expect(nestConfigService.get).toHaveBeenCalledWith('AWS_REGION');
    });

    it('should return awsBucketName from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('my-bucket');

      // Act
      const result = sut.awsBucketName;

      // Assert
      expect(result).toBe('my-bucket');
      expect(nestConfigService.get).toHaveBeenCalledWith('AWS_BUCKET_NAME');
    });

    it('should return smtpHost from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('smtp.example.com');

      // Act
      const result = sut.smtpHost;

      // Assert
      expect(result).toBe('smtp.example.com');
      expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_HOST');
    });

    it('should return smtpPort from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue(587);

      // Act
      const result = sut.smtpPort;

      // Assert
      expect(result).toBe(587);
      expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_PORT');
    });

    it('should return smtpTo from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('to@example.com');

      // Act
      const result = sut.smtpTo;

      // Assert
      expect(result).toBe('to@example.com');
      expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_TO');
    });

    it('should return smtpFrom from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('from@example.com');

      // Act
      const result = sut.smtpFrom;

      // Assert
      expect(result).toBe('from@example.com');
      expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_FROM');
    });

    it('should return smtpUsername from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('smtp-user');

      // Act
      const result = sut.smtpUsername;

      // Assert
      expect(result).toBe('smtp-user');
      expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_USERNAME');
    });

    it('should return smtpPassword from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('smtp-password');

      // Act
      const result = sut.smtpPassword;

      // Assert
      expect(result).toBe('smtp-password');
      expect(nestConfigService.get).toHaveBeenCalledWith('SMTP_PASSWORD');
    });

    it('should return redisUrl from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('redis://localhost:6379');

      // Act
      const result = sut.redisUrl;

      // Assert
      expect(result).toBe('redis://localhost:6379');
      expect(nestConfigService.get).toHaveBeenCalledWith('REDIS_URL');
    });

    it('should return viacepApiUrl from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('https://viacep.com.br/ws');

      // Act
      const result = sut.viacepApiUrl;

      // Assert
      expect(result).toBe('https://viacep.com.br/ws');
      expect(nestConfigService.get).toHaveBeenCalledWith('VIACEP_API_URL');
    });

    it('should return cnpjaApiUrl from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('https://api.cnpja.com');

      // Act
      const result = sut.cnpjaApiUrl;

      // Assert
      expect(result).toBe('https://api.cnpja.com');
      expect(nestConfigService.get).toHaveBeenCalledWith('CNPJA_API_URL');
    });

    it('should return cnpjaApiKey from nestConfigService', () => {
      // Arrange
      nestConfigService.get.mockReturnValue('test-cnpja-api-key');

      // Act
      const result = sut.cnpjaApiKey;

      // Assert
      expect(result).toBe('test-cnpja-api-key');
      expect(nestConfigService.get).toHaveBeenCalledWith('CNPJA_API_KEY');
    });
  });
});
