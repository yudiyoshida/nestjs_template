import { UUID } from './uuid.vo';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('UUID - Unit tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Happy path', () => {
    it('should create a uuid value object with a valid v4 uuid', () => {
      // Act
      const sut = new UUID();

      // Assert
      expect(sut.value).toMatch(UUID_V4_REGEX);
    });

    it('should return the generated uuid when accessing value', () => {
      // Act
      const sut = new UUID();

      // Assert
      expect(typeof sut.value).toBe('string');
      expect(sut.value).toHaveLength(36);
    });

    it('should use crypto.randomUUID to generate the value', () => {
      // Arrange
      const fixedUuid = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
      jest.spyOn(crypto, 'randomUUID').mockReturnValue(fixedUuid);

      // Act
      const sut = new UUID();

      // Assert
      expect(sut.value).toBe(fixedUuid);
      expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should generate different uuids for different instances', () => {
      // Act
      const sut = new UUID();
      const other = new UUID();

      // Assert
      expect(sut.value).not.toBe(other.value);
    });

    it('should return the same value on multiple accesses', () => {
      // Arrange
      const sut = new UUID();

      // Act
      const firstAccess = sut.value;
      const secondAccess = sut.value;

      // Assert
      expect(firstAccess).toBe(secondAccess);
    });
  });
});
