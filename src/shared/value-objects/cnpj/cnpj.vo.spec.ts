import { InvalidCnpjError } from './cnpj.error';
import { CNPJ } from './cnpj.vo';

describe('CNPJ - Unit tests', () => {
  describe('Happy path', () => {
    it('should create a cnpj value object when providing a valid numeric cnpj', () => {
      // Arrange
      const input = '11222333000181';

      // Act
      const sut = new CNPJ(input);

      // Assert
      expect(sut.value).toBe('11222333000181');
    });

    it('should create a cnpj value object when providing a valid alphanumeric cnpj', () => {
      // Arrange
      const input = '12ABC34501DE35';

      // Act
      const sut = new CNPJ(input);

      // Assert
      expect(sut.value).toBe('12ABC34501DE35');
    });
  });

  describe('Error path', () => {
    it('should throw InvalidCnpjError when all characters are equal', () => {
      // Act & Assert
      expect(() => new CNPJ('11111111111111')).toThrow(InvalidCnpjError);
    });

    it('should throw InvalidCnpjError when the first check digit is invalid', () => {
      // Act & Assert
      expect(() => new CNPJ('11222333000191')).toThrow(InvalidCnpjError);
    });

    it('should throw InvalidCnpjError when the second check digit is invalid', () => {
      // Act & Assert
      expect(() => new CNPJ('11222333000180')).toThrow(InvalidCnpjError);
    });

    it.each([
      null,
      undefined,
      '',
      '           ',
      '1122233300018',
      '112223330001811',
      '1122233300#181',
      '112223330001AB',
    ])('should throw InvalidCnpjError when providing an invalid cnpj (%s)', (cnpj: any) => {
      // Act & Assert
      expect(() => new CNPJ(cnpj)).toThrow(InvalidCnpjError);
    });
  });

  describe('Edge cases', () => {
    it('should sanitize mask characters when providing a formatted numeric cnpj', () => {
      // Arrange
      const input = '11.222.333/0001-81';

      // Act
      const sut = new CNPJ(input);

      // Assert
      expect(sut.value).toBe('11222333000181');
    });

    it('should sanitize mask and uppercase letters when providing a formatted lowercase alphanumeric cnpj', () => {
      // Arrange
      const input = '12.abc.345/01de-35';

      // Act
      const sut = new CNPJ(input);

      // Assert
      expect(sut.value).toBe('12ABC34501DE35');
    });
  });
});
