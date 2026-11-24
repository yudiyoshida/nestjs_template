import { CacheFakeAdapterGateway } from './cache-fake.gateway';

describe('CacheFakeAdapterGateway - Unit tests', () => {
  let sut: CacheFakeAdapterGateway;

  beforeEach(() => {
    sut = new CacheFakeAdapterGateway();
  });

  describe('set', () => {
    describe('Happy path', () => {
      it('should store a value that can be retrieved afterwards', async() => {
        // Act
        await sut.set('key', { foo: 'bar' });

        // Assert
        expect(await sut.get('key')).toEqual({ foo: 'bar' });
      });

      it('should store the value regardless of skipLog', async() => {
        // Act
        await sut.set('key', 'value', 60, true);

        // Assert
        expect(await sut.get('key')).toBe('value');
      });
    });

    describe('Edge cases', () => {
      it('should overwrite the value when the key already exists', async() => {
        // Arrange
        await sut.set('key', 'first');

        // Act
        await sut.set('key', 'second');

        // Assert
        expect(await sut.get('key')).toBe('second');
      });

      it.each([
        undefined,
        0,
        -10,
      ])('should store without expiration when ttlInSeconds is %s', async(ttlInSeconds: any) => {
        // Act
        await sut.set('key', 'value', ttlInSeconds);

        // Assert
        expect(await sut.get('key')).toBe('value');
      });

      it('should store a null value', async() => {
        // Act
        await sut.set('key', null);

        // Assert
        expect(await sut.get('key')).toBeNull();
      });
    });
  });

  describe('get', () => {
    describe('Happy path', () => {
      it('should return the stored value before the ttl expires', async() => {
        // Arrange
        await sut.set('key', 'value', 60);

        // Act
        const result = await sut.get('key');

        // Assert
        expect(result).toBe('value');
      });
    });

    describe('Edge cases', () => {
      it('should return null when the key does not exist', async() => {
        // Act
        const result = await sut.get('missing');

        // Assert
        expect(result).toBeNull();
      });

      describe('with expired entries', () => {
        beforeEach(() => {
          jest.useFakeTimers();
        });

        afterEach(() => {
          jest.useRealTimers();
        });

        it('should return null once the ttl has expired', async() => {
          // Arrange
          await sut.set('key', 'value', 1);

          // Act
          jest.advanceTimersByTime(1001);
          const result = await sut.get('key');

          // Assert
          expect(result).toBeNull();
        });

        it('should drop the expired entry from the store', async() => {
          // Arrange
          await sut.set('key', 'value', 1);
          jest.advanceTimersByTime(1001);
          await sut.get('key');

          // Act
          jest.setSystemTime(Date.now() - 5000);
          const result = await sut.get('key');

          // Assert
          expect(result).toBeNull();
        });
      });
    });
  });

  describe('delete', () => {
    describe('Happy path', () => {
      it('should remove the stored value', async() => {
        // Arrange
        await sut.set('key', 'value');

        // Act
        await sut.delete('key');

        // Assert
        expect(await sut.get('key')).toBeNull();
      });

      it('should keep the other keys untouched', async() => {
        // Arrange
        await sut.set('key', 'value');
        await sut.set('other', 'other-value');

        // Act
        await sut.delete('key');

        // Assert
        expect(await sut.get('other')).toBe('other-value');
      });
    });

    describe('Edge cases', () => {
      it('should not throw when the key does not exist', async() => {
        // Act & Assert
        await expect(sut.delete('missing')).resolves.toBeUndefined();
      });
    });
  });

  describe('deleteContaining', () => {
    describe('Happy path', () => {
      it('should delete every key containing the given substring', async() => {
        // Arrange
        await sut.set('user:1:profile', 'a');
        await sut.set('user:2:profile', 'b');
        await sut.set('order:1', 'c');

        // Act
        await sut.deleteContaining('profile');

        // Assert
        expect(await sut.get('user:1:profile')).toBeNull();
        expect(await sut.get('user:2:profile')).toBeNull();
        expect(await sut.get('order:1')).toBe('c');
      });

      it('should treat * inside the key as a wildcard, like the redis match', async() => {
        // Arrange
        await sut.set('cache:global:example:list', 'a');
        await sut.set('cache:global:example:detail:1', 'b');
        await sut.set('cache:global:other:list', 'c');

        // Act
        await sut.deleteContaining('cache:global:example:*');

        // Assert
        expect(await sut.get('cache:global:example:list')).toBeNull();
        expect(await sut.get('cache:global:example:detail:1')).toBeNull();
        expect(await sut.get('cache:global:other:list')).toBe('c');
      });

      it('should treat ? inside the key as exactly one character', async() => {
        // Arrange
        await sut.set('user:1:profile', 'a');
        await sut.set('user:10:profile', 'b');

        // Act
        await sut.deleteContaining('user:?:profile');

        // Assert
        expect(await sut.get('user:1:profile')).toBeNull();
        expect(await sut.get('user:10:profile')).toBe('b');
      });
    });

    describe('Edge cases', () => {
      it('should match a literal * when it is escaped with a backslash', async() => {
        // Arrange
        await sut.set('search:a*b', 'a');
        await sut.set('search:axxb', 'b');

        // Act
        await sut.deleteContaining('a\\*b');

        // Assert
        expect(await sut.get('search:a*b')).toBeNull();
        expect(await sut.get('search:axxb')).toBe('b');
      });

      it('should treat regex metacharacters in the key as literal text', async() => {
        // Arrange
        await sut.set('cache:a.b', 'a');
        await sut.set('cache:axb', 'b');

        // Act
        await sut.deleteContaining('a.b');

        // Assert
        expect(await sut.get('cache:a.b')).toBeNull();
        expect(await sut.get('cache:axb')).toBe('b');
      });

      it('should not throw when no key matches', async() => {
        // Act & Assert
        await expect(sut.deleteContaining('nothing')).resolves.toBeUndefined();
      });

      it('should delete every key when the substring is empty', async() => {
        // Arrange
        await sut.set('user:1:profile', 'a');
        await sut.set('order:1', 'b');

        // Act
        await sut.deleteContaining('');

        // Assert
        expect(await sut.get('user:1:profile')).toBeNull();
        expect(await sut.get('order:1')).toBeNull();
      });
    });
  });
});
