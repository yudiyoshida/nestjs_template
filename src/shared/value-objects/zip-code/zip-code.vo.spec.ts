import { InvalidZipCodeError } from './zip-code.error';
import { ZipCode } from './zip-code.vo';

describe('ZipCode - Unit tests', () => {
  describe('Happy path', () => {
    it('should create a zip code value object when providing a valid zip code', () => {
      // Arrange
      const input = '01310100';

      // Act
      const sut = new ZipCode(input);

      // Assert
      expect(sut.value).toBe('01310100');
    });

    it.each([
      ['01310-100', '01310100'],
      ['01310.100', '01310100'],
      ['01310 100', '01310100'],
      [' 01310100 ', '01310100'],
      ['0 1.3 1 0-1 0 0', '01310100'],
      ['\t01310\n100', '01310100'],
    ])('should normalize %s to %s', (input: string, expected: string) => {
      // Act
      const sut = new ZipCode(input);

      // Assert
      expect(sut.value).toBe(expected);
    });
  });

  describe('Error path', () => {
    it.each([
      null,
      undefined,
      '',
      '           ',
      '-.-',
      '0131010',
      '013101000',
      'abcdefgh',
      '0131O100',
      '01310+100',
      '01310/100',
      1310100,
      {},
      [],
    ])(
      'should throw InvalidZipCodeError when providing an invalid zip code (%s)',
      (zipCode: any) => {
        // Act & Assert
        expect(() => new ZipCode(zipCode)).toThrow(InvalidZipCodeError);
      },
    );

    it('should throw an error with the raw zip code in the message', () => {
      // Act & Assert
      expect(() => new ZipCode('01310-10')).toThrow('CEP inválido: 01310-10');
    });
  });

  describe('Edge cases', () => {
    it('should create a zip code value object when providing only zeros', () => {
      // Act
      const sut = new ZipCode('00000000');

      // Assert
      expect(sut.value).toBe('00000000');
    });

    it('should keep the value immutable after creation', () => {
      // Arrange
      const sut = new ZipCode('01310-100');

      // Act
      const result = sut.value;

      // Assert
      expect(result).toBe('01310100');
      expect(sut.value).toBe('01310100');
    });
  });
});
