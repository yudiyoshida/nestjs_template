import { HttpModule } from '@nestjs/axios';
import { ClassProvider } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { CnpjLookupVendor } from 'src/infra/infra-vendors';
import { CnpjLookupCnpjaAdapterGateway } from './adapters/cnpja/cnpj-lookup-cnpja.gateway';
import { CnpjLookupFakeAdapterGateway } from './adapters/fake/cnpj-lookup-fake.gateway';
import { CnpjLookupModule } from './cnpj-lookup.module';

describe('CnpjLookupModule - Unit tests', () => {
  let originalNodeEnv: string | undefined;
  let originalVendor: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalVendor = process.env.CNPJ_LOOKUP_VENDOR;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.CNPJ_LOOKUP_VENDOR = originalVendor;
  });

  describe('register', () => {
    describe('Happy path', () => {
      it('should bind the fake adapter when NODE_ENV is test even with a real vendor configured', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;
        process.env.CNPJ_LOOKUP_VENDOR = CnpjLookupVendor.Cnpja;

        // Act
        const result = CnpjLookupModule.register();

        // Assert
        expect((result.providers?.[0] as ClassProvider).useClass).toBe(CnpjLookupFakeAdapterGateway);
        expect(result.imports).toEqual([]);
      });

      it('should bind the cnpja adapter with its modules when the vendor is cnpja outside test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.CNPJ_LOOKUP_VENDOR = CnpjLookupVendor.Cnpja;

        // Act
        const result = CnpjLookupModule.register();

        // Assert
        expect((result.providers?.[0] as ClassProvider).useClass).toBe(CnpjLookupCnpjaAdapterGateway);
        expect(result.imports).toEqual([ConfigModule, HttpModule]);
      });

      it('should bind the fake adapter when the vendor is fake outside test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Development;
        process.env.CNPJ_LOOKUP_VENDOR = CnpjLookupVendor.Fake;

        // Act
        const result = CnpjLookupModule.register();

        // Assert
        expect((result.providers?.[0] as ClassProvider).useClass).toBe(CnpjLookupFakeAdapterGateway);
        expect(result.imports).toEqual([]);
      });

      it('should provide and export the cnpj lookup token from the module itself', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.CNPJ_LOOKUP_VENDOR = CnpjLookupVendor.Cnpja;

        // Act
        const result = CnpjLookupModule.register();

        // Assert
        expect(result.module).toBe(CnpjLookupModule);
        expect((result.providers?.[0] as ClassProvider).provide).toBe(TOKENS.CnpjLookupGateway);
        expect(result.exports).toEqual([TOKENS.CnpjLookupGateway]);
      });
    });

    describe('Error path', () => {
      beforeEach(() => {
        process.env.NODE_ENV = Environment.Production;
      });

      it('should throw when the configured vendor is not supported', () => {
        // Arrange
        process.env.CNPJ_LOOKUP_VENDOR = 'receitaws';

        // Act & Assert
        expect(() => CnpjLookupModule.register()).toThrow('Invalid CNPJ_LOOKUP_VENDOR "receitaws"');
      });

      it('should throw with an empty vendor name when CNPJ_LOOKUP_VENDOR is not set', () => {
        // Arrange
        delete process.env.CNPJ_LOOKUP_VENDOR;

        // Act & Assert
        expect(() => CnpjLookupModule.register()).toThrow('Invalid CNPJ_LOOKUP_VENDOR ""');
      });

      it('should throw when CNPJ_LOOKUP_VENDOR is an empty string', () => {
        // Arrange
        process.env.CNPJ_LOOKUP_VENDOR = '';

        // Act & Assert
        expect(() => CnpjLookupModule.register()).toThrow('Invalid CNPJ_LOOKUP_VENDOR ""');
      });
    });

    describe('Edge cases', () => {
      it('should ignore an invalid vendor when NODE_ENV is test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;
        process.env.CNPJ_LOOKUP_VENDOR = 'receitaws';

        // Act
        const result = CnpjLookupModule.register();

        // Assert
        expect((result.providers?.[0] as ClassProvider).useClass).toBe(CnpjLookupFakeAdapterGateway);
      });

      it('should ignore a missing vendor when NODE_ENV is test', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Test;
        delete process.env.CNPJ_LOOKUP_VENDOR;

        // Act
        const result = CnpjLookupModule.register();

        // Assert
        expect((result.providers?.[0] as ClassProvider).useClass).toBe(CnpjLookupFakeAdapterGateway);
      });

      it('should throw when NODE_ENV is not set and no vendor is configured', () => {
        // Arrange
        delete process.env.NODE_ENV;
        delete process.env.CNPJ_LOOKUP_VENDOR;

        // Act & Assert
        expect(() => CnpjLookupModule.register()).toThrow('Invalid CNPJ_LOOKUP_VENDOR ""');
      });

      it('should return a single provider when the vendor binding has no extra providers', () => {
        // Arrange
        process.env.NODE_ENV = Environment.Production;
        process.env.CNPJ_LOOKUP_VENDOR = CnpjLookupVendor.Cnpja;

        // Act
        const result = CnpjLookupModule.register();

        // Assert
        expect(result.providers).toHaveLength(1);
      });
    });
  });
});
