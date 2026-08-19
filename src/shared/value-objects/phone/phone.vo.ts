import { InvalidPhoneError } from './phone.error';

export class Phone {
  private readonly FORMAT = /^\d{10,11}$/;
  private readonly _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(raw: string) {
    const phone = this.sanitize(raw);

    if (!this.validate(phone)) {
      throw new InvalidPhoneError();
    }

    this._value = phone;
  }

  private sanitize(phone: string): string {
    return typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
  }

  private validate(phone: string): boolean {
    if (!phone) return false;

    return this.FORMAT.test(phone);
  }
}
