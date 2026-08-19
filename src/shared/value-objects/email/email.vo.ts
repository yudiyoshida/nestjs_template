import { InvalidEmailError } from './email.error';

export class Email {
  private readonly FORMAT = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  private readonly _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(raw: string) {
    const email = this.sanitize(raw);

    if (!this.validate(email)) {
      throw new InvalidEmailError();
    }

    this._value = email;
  }

  private sanitize(email: string): string {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
  }

  private validate(email: string): boolean {
    if (!email) return false;

    return this.FORMAT.test(email);
  }
}
