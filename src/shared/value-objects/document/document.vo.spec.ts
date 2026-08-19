import { InvalidCnpjError } from '../cnpj/cnpj.error';
import { InvalidCpfError } from '../cpf/cpf.error';
import { Document } from './document.vo';
import { InvalidDocumentError } from './document.error';

describe('Document - Unit tests', () => {
  describe('Happy path', () => {
    it('should create a document when providing a masked valid cpf', () => {
      // Arrange
      const input = '820.670.530-94';

      // Act
      const sut = new Document(input);

      // Assert
      expect(sut.value).toBe('82067053094');
    });

    it('should create a document when providing an unmasked valid cpf', () => {
      // Arrange
      const input = '82067053094';

      // Act
      const sut = new Document(input);

      // Assert
      expect(sut.value).toBe('82067053094');
    });

    it('should create a document when providing a masked valid cnpj', () => {
      // Arrange
      const input = '11.222.333/0001-81';

      // Act
      const sut = new Document(input);

      // Assert
      expect(sut.value).toBe('11222333000181');
    });

    it('should create a document when providing an unmasked valid cnpj', () => {
      // Arrange
      const input = '11222333000181';

      // Act
      const sut = new Document(input);

      // Assert
      expect(sut.value).toBe('11222333000181');
    });
  });

  describe('Error path', () => {
    it.each([
      '123456789',
      '123456789012',
      '1234567890123',
      '123456789012345',
      '',
      '   ',
      null,
      undefined,
      123,
      {},
      [],
    ])('should throw InvalidDocumentError when providing an invalid document (%s)', (raw: any) => {
      // Act & Assert
      expect(() => new Document(raw)).toThrow(InvalidDocumentError);
    });

    it('should throw InvalidCpfError when document has cpf length but invalid cpf digits', () => {
      // Act & Assert
      expect(() => new Document('11111111111')).toThrow(InvalidCpfError);
    });

    it('should throw InvalidCnpjError when document has cnpj length but invalid cnpj digits', () => {
      // Act & Assert
      expect(() => new Document('11111111111111')).toThrow(InvalidCnpjError);
    });
  });
});
