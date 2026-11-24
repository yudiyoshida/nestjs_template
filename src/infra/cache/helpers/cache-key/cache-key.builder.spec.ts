import { CacheKeyBuilderError } from 'src/infra/cache/helpers/cache-key/cache-key-builder.error';
import { CacheKeyBuilder } from './cache-key.builder';

describe('CacheKeyBuilder - Unit tests', () => {
  let sut: CacheKeyBuilder;

  beforeEach(() => {
    sut = new CacheKeyBuilder();
  });

  describe('setAccount', () => {
    describe('Happy path', () => {
      it('should return the same instance to allow chaining', () => {
        // Act
        const result = sut.setAccount('acc-id');

        // Assert
        expect(result).toBe(sut);
      });

      it('should scope the key to the given account', () => {
        // Act
        const result = sut.setAccount('acc-id').setResource('account').setCommand('list').build();

        // Assert
        expect(result).toBe('cache:acc-id:account:list');
      });
    });

    describe('Edge cases', () => {
      it.each([
        '',
        undefined,
      ])('should fall back to the global scope when the accountId is %s', (accountId: any) => {
        // Act
        const result = sut.setAccount(accountId).setResource('account').setCommand('list').build();

        // Assert
        expect(result).toBe('cache:global:account:list');
      });

      it('should keep the last accountId when called twice', () => {
        // Act
        const result = sut.setAccount('first').setAccount('second').setResource('account').setCommand('list').build();

        // Assert
        expect(result).toBe('cache:second:account:list');
      });
    });
  });

  describe('setResource', () => {
    describe('Happy path', () => {
      it('should return the same instance to allow chaining', () => {
        // Act
        const result = sut.setResource('account');

        // Assert
        expect(result).toBe(sut);
      });

      it('should place the resource after the scope', () => {
        // Act
        const result = sut.setResource('account').setCommand('list').build();

        // Assert
        expect(result).toBe('cache:global:account:list');
      });
    });

    describe('Edge cases', () => {
      it('should accept the wildcard resource', () => {
        // Act
        const result = sut.setResource('*').setCommand('*').build();

        // Assert
        expect(result).toBe('cache:global:*:*');
      });

      it('should keep the last resource when called twice', () => {
        // Act
        const result = sut.setResource('account').setResource('refresh-token').setCommand('list').build();

        // Assert
        expect(result).toBe('cache:global:refresh-token:list');
      });
    });
  });

  describe('setCommand', () => {
    describe('Happy path', () => {
      it('should return the same instance to allow chaining', () => {
        // Act
        const result = sut.setCommand('list');

        // Assert
        expect(result).toBe(sut);
      });

      it('should append the serialized query when the command is list', () => {
        // Act
        const result = sut.setResource('account').setCommand('list', { page: 1, size: 10 }).build();

        // Assert
        expect(result).toBe('cache:global:account:list:{"page":1,"size":10}');
      });

      it('should append the raw id when the command is detail', () => {
        // Act
        const result = sut.setResource('account').setCommand('detail', 'account-1').build();

        // Assert
        expect(result).toBe('cache:global:account:detail:account-1');
      });
    });

    describe('Edge cases', () => {
      it('should accept the wildcard command without data', () => {
        // Act
        const result = sut.setResource('account').setCommand('*').build();

        // Assert
        expect(result).toBe('cache:global:account:*');
      });

      it('should keep the last command and data when called twice', () => {
        // Act
        const result = sut.setResource('account').setCommand('detail', 'id').setCommand('list').build();

        // Assert
        expect(result).toBe('cache:global:account:list');
      });
    });
  });

  describe('build', () => {
    describe('Happy path', () => {
      it.each([
        ['cache:global:account:list', undefined, 'account', 'list', undefined],
        ['cache:global:account:list:{"page":1,"size":10}', undefined, 'account', 'list', { page: 1, size: 10 }],
        ['cache:global:account:detail:123', undefined, 'account', 'detail', '123'],
        ['cache:global:refresh-token:detail:abc123', '', 'refresh-token', 'detail', 'abc123'],
        ['cache:global:refresh-token:list:{"search":"xpto"}', undefined, 'refresh-token', 'list', { search: 'xpto' }],
        ['cache:global:refresh-token:detail:account-123', undefined, 'refresh-token', 'detail', 'account-123'],
        ['cache:acc-id:account:list', 'acc-id', 'account', 'list', undefined],
        ['cache:acc-id:account:list:{"page":1,"size":10}', 'acc-id', 'account', 'list', { page: 1, size: 10 }],
        ['cache:acc-id:account:detail:123', 'acc-id', 'account', 'detail', '123'],
        ['cache:acc-id:refresh-token:list:{"search":"xpto"}', 'acc-id', 'refresh-token', 'list', { search: 'xpto' }],
        ['cache:acc-id:refresh-token:detail:random-id', 'acc-id', 'refresh-token', 'detail', 'random-id'],
        ['cache:acc-id:refresh-token:list', 'acc-id', 'refresh-token', 'list', undefined],
        ['cache:global:refresh-token:list', undefined, 'refresh-token', 'list', undefined],
      ])('should build %s', (expected: string, accountId: any, resource: any, command: any, data: any) => {
        // Act
        const result = sut
          .setAccount(accountId)
          .setResource(resource)
          .setCommand(command, data)
          .build();

        // Assert
        expect(result).toBe(expected);
      });
    });

    describe('Error path', () => {
      it('should throw when the resource was not provided', () => {
        // Act & Assert
        expect(() => sut.build()).toThrow(new CacheKeyBuilderError('resource'));
      });

      it('should throw when the command was not provided', () => {
        // Act & Assert
        expect(() => sut.setResource('account').build()).toThrow(new CacheKeyBuilderError('command'));
      });
    });

    describe('Edge cases', () => {
      it('should append an empty json object when the query is empty', () => {
        // Act
        const result = sut.setResource('account').setCommand('list', {}).build();

        // Assert
        expect(result).toBe('cache:global:account:list:{}');
      });

      it('should always prefix the key with cache', () => {
        // Act
        const result = sut.setResource('account').setCommand('list').build();

        // Assert
        expect(result.startsWith('cache:')).toBe(true);
      });

      it('should omit the data segment when the id is an empty string', () => {
        // Act
        const result = sut.setResource('account').setCommand('detail', '').build();

        // Assert
        expect(result).toBe('cache:global:account:detail');
      });
    });
  });
});
