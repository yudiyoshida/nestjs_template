import { InvalidPhoneError } from './phone.error';
import { Phone } from './phone.vo';

describe('Phone - Unit tests', () => {
  it.each(
    [
      null,
      undefined,
      '',
      '           ',
      '1',
      'invalid-phone',
      '(000) 00000-0000',
      '(00) 12345-12345',
      '(11) 1234-123',
      '123456789',
      '123456789123456',
    ]
  )('should throw an error when providing invalid phone (%s)', (phone: any) => {
    // Act & Assert
    expect(() => new Phone(phone)).toThrow('Telefone inválido');
    expect(() => new Phone(phone)).toThrow(InvalidPhoneError);
  });

  it.each(
    [
      '(11) 12345-1234',
      '00 12345-1234',
      '00 123451234',
      '00 12345123',
      '00123456789',
    ]
  )('should create a phone value object when providing valid phone (%s)', (phone: string) => {
    // Act
    const sut = new Phone(phone);

    // Assert
    expect(sut).toBeInstanceOf(Phone);
    expect(sut.value).toBe(phone.replace(/\D/g, ''));
  });
});
