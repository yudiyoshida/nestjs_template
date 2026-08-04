import { CacheFakeAdapterGateway } from './cache-fake.gateway';

describe('CacheFakeAdapterGateway - Unit tests', () => {
  let sut: CacheFakeAdapterGateway;

  beforeEach(() => {
    sut = new CacheFakeAdapterGateway();
  });

  describe('set/get', () => {
    it('should store and retrieve a value', async() => {
      // Act
      await sut.set('key', { foo: 'bar' });
      const result = await sut.get('key');

      // Assert
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return null when key does not exist', async() => {
      // Act
      const result = await sut.get('missing');

      // Assert
      expect(result).toBeNull();
    });

    it('should return the value when ttlInSeconds is not provided', async() => {
      // Act
      await sut.set('key', 'value');
      const result = await sut.get('key');

      // Assert
      expect(result).toBe('value');
    });

    it('should return the value before ttl expires', async() => {
      // Act
      await sut.set('key', 'value', 60);
      const result = await sut.get('key');

      // Assert
      expect(result).toBe('value');
    });

    it('should return null and delete the entry after ttl expires', async() => {
      // Arrange
      jest.useFakeTimers();
      await sut.set('key', 'value', 1);

      // Act
      jest.advanceTimersByTime(1001);
      const result = await sut.get('key');

      // Assert
      expect(result).toBeNull();
      jest.useRealTimers();
    });

    it('should treat zero or negative ttlInSeconds as no expiration', async() => {
      // Act
      await sut.set('key', 'value', 0);
      const result = await sut.get('key');

      // Assert
      expect(result).toBe('value');
    });
  });

  describe('delete', () => {
    it('should remove the stored value', async() => {
      // Arrange
      await sut.set('key', 'value');

      // Act
      await sut.delete('key');

      // Assert
      expect(await sut.get('key')).toBeNull();
    });

    it('should not throw when deleting a non-existent key', async() => {
      // Act & Assert
      await expect(sut.delete('missing')).resolves.toBeUndefined();
    });
  });

  describe('deleteContaining', () => {
    it('should delete all keys containing the given substring', async() => {
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

    it('should not throw when no keys match', async() => {
      // Act & Assert
      await expect(sut.deleteContaining('nothing')).resolves.toBeUndefined();
    });
  });
});
