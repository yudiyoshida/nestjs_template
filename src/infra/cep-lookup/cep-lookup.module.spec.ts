import { HttpModule } from '@nestjs/axios';
import { ClassProvider } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { CepLookupVendor } from 'src/infra/infra-vendors';
import { CepLookupFakeAdapterGateway } from './adapters/fake/cep-lookup-fake.gateway';
import { CepLookupViacepAdapterGateway } from './adapters/viacep/cep-lookup-viacep.gateway';
import { CepLookupModule } from './cep-lookup.module';

describe('CepLookupModule - Unit tests', () => {
  let originalNodeEnv: string | undefined;
  let originalVendor: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalVendor = process.env.CEP_LOOKUP_VENDOR;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.CEP_LOOKUP_VENDOR = originalVendor;
  });

  describe('register', () => {
    describe('Happy path', () => {
      it('should bind the fake adapter when NODE_ENV is test even with a real vendor configured', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;
        process.env.CEP_LOOKUP_VENDOR = CepLookupVendor.Viacep;

        // Act
        const result = CepLookupModule.register();

        // Assert
        expect((result.providers?.[0] as ClassProvider).useClass).toBe(CepLookupFakeAdapterGateway);
        expect(result.imports).toEqual([]);
      });

      it('should bind the viacep adapter with its modules when the vendor is viacep outside test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.CEP_LOOKUP_VENDOR = CepLookupVendor.Viacep;

        // Act
        const result = CepLookupModule.register();

        // Assert
        expect((result.providers?.[0] as ClassProvider).useClass).toBe(CepLookupViacepAdapterGateway);
        expect(result.imports).toEqual([ConfigModule, HttpModule]);
      });

      it('should bind the fake adapter when the vendor is fake outside test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Development;
        process.env.CEP_LOOKUP_VENDOR = CepLookupVendor.Fake;

        // Act
        const result = CepLookupModule.register();

        // Assert
        expect((result.providers?.[0] as ClassProvider).useClass).toBe(CepLookupFakeAdapterGateway);
        expect(result.imports).toEqual([]);
      });

      it('should provide and export the cep lookup token from the module itself', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.CEP_LOOKUP_VENDOR = CepLookupVendor.Viacep;

        // Act
        const result = CepLookupModule.register();

        // Assert
        expect(result.module).toBe(CepLookupModule);
        expect((result.providers?.[0] as ClassProvider).provide).toBe(TOKENS.CepLookupGateway);
        expect(result.exports).toEqual([TOKENS.CepLookupGateway]);
      });
    });

    describe('Error path', () => {
      beforeEach(() => {
        process.env.NODE_ENV = Environment.Production;
      });

      it('should throw when the configured vendor is not supported', () => {
        // Arrange
        process.env.CEP_LOOKUP_VENDOR = 'brasilapi';

        // Act & Assert
        expect(() => CepLookupModule.register()).toThrow('Invalid CEP_LOOKUP_VENDOR "brasilapi"');
      });

      it('should throw with an empty vendor name when CEP_LOOKUP_VENDOR is not set', () => {
        // Arrange
        delete process.env.CEP_LOOKUP_VENDOR;

        // Act & Assert
        expect(() => CepLookupModule.register()).toThrow('Invalid CEP_LOOKUP_VENDOR ""');
      });

      it('should throw when CEP_LOOKUP_VENDOR is an empty string', () => {
        // Arrange
        process.env.CEP_LOOKUP_VENDOR = '';

        // Act & Assert
        expect(() => CepLookupModule.register()).toThrow('Invalid CEP_LOOKUP_VENDOR ""');
      });
    });

    describe('Edge cases', () => {
      it('should ignore an invalid vendor when NODE_ENV is test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;
        process.env.CEP_LOOKUP_VENDOR = 'brasilapi';

        // Act
        const result = CepLookupModule.register();

        // Assert
        expect((result.providers?.[0] as ClassProvider).useClass).toBe(CepLookupFakeAdapterGateway);
      });

      it('should ignore a missing vendor when NODE_ENV is test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;
        delete process.env.CEP_LOOKUP_VENDOR;

        // Act
        const result = CepLookupModule.register();

        // Assert
        expect((result.providers?.[0] as ClassProvider).useClass).toBe(CepLookupFakeAdapterGateway);
      });

      it('should throw when NODE_ENV is not set and no vendor is configured', () => {
        // Arrange
        delete process.env.NODE_ENV;
        delete process.env.CEP_LOOKUP_VENDOR;

        // Act & Assert
        expect(() => CepLookupModule.register()).toThrow('Invalid CEP_LOOKUP_VENDOR ""');
      });

      it('should return a single provider when the vendor binding has no extra providers', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.CEP_LOOKUP_VENDOR = CepLookupVendor.Viacep;

        // Act
        const result = CepLookupModule.register();

        // Assert
        expect(result.providers).toHaveLength(1);
      });
    });
  });
});
