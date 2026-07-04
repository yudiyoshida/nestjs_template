import { InvalidEmailError } from './email.error';
import { Email } from './email.vo';

describe('Email Value Object', () => {
  it.each(
    [
      null,
      undefined,
      '',
      '           ',
      'invalid-email',
      'invalid-email@',
      'invalid-email.com',
      'invalid-email@.com',
      'invalid-email@@.com.',
      'invalid-email@invalid-domain',
      'invalid-email@invalid-domain.',
      'invalid-email@invalid-domain.c',
    ]
  )('should throw an error when providing invalid email (%s)', (email: string) => {
    // Act & Assert
    expect(() => new Email(email)).toThrow('E-mail inválido');
    expect(() => new Email(email)).toThrow(InvalidEmailError);
  });

  it.each(
    [
      'jhondoe@email.com',
      'jhondoe@email.com.br',
      'jhondoe@gmail.com',
      'jhondoe12@yahoo.com.br',
    ]
  )('should create a email value object when providing valid email (%s)', (email: string) => {
    // Act
    const emailVo = new Email(email);

    // Assert
    expect(emailVo).toBeInstanceOf(Email);
    expect(emailVo.value).toBe(email);
  });
});
