import { InvalidCpfError } from './cpf.error';
import { CPF } from './cpf.vo';

describe('CPF - Unit tests', () => {
  describe('Happy path', () => {
    it('should create a cpf value object when providing a valid formatted cpf', () => {
      // Arrange
      const input = '111.444.777-35';

      // Act
      const sut = new CPF(input);

      // Assert
      expect(sut.value).toBe('11144477735');
    });
  });

  describe('Error path', () => {
    it.each([
      null,
      undefined,
      '',
      '           ',
      'invalid-cpf',
      '123.456.789-00',
    ])('should throw InvalidCpfError when providing an invalid cpf (%s)', (cpf: any) => {
      // Act & Assert
      expect(() => new CPF(cpf)).toThrow(InvalidCpfError);
    });

    it.each([
      '111.111.111-11',
      '000.000.000-00',
      '22222222222',
    ])('should throw InvalidCpfError when all digits are equal (%s)', (cpf: any) => {
      // Act & Assert
      expect(() => new CPF(cpf)).toThrow(InvalidCpfError);
    });

    it('should throw InvalidCpfError when the first check digit is wrong', () => {
      // Act & Assert
      expect(() => new CPF('111.444.777-45')).toThrow(InvalidCpfError);
    });

    it('should throw InvalidCpfError when the second check digit is wrong', () => {
      // Act & Assert
      expect(() => new CPF('111.444.777-30')).toThrow(InvalidCpfError);
    });

    it.each([
      '1234567890',
      '123456789012',
    ])('should throw InvalidCpfError when cpf length is not 11 (%s)', (cpf: any) => {
      // Act & Assert
      expect(() => new CPF(cpf)).toThrow(InvalidCpfError);
    });
  });

  describe('Edge cases', () => {
    it.each([
      ['111.444.777-35', '11144477735'],
      ['11144477735', '11144477735'],
      ['111 444 777 35', '11144477735'],
    ])('should normalize %s to %s', (input: string, expected: string) => {
      // Act
      const sut = new CPF(input);

      // Assert
      expect(sut.value).toBe(expected);
    });
  });
});
