import { InvalidZipCodeError } from './zip-code.error';

export class ZipCode {
  private readonly FORMAT = /^\d{8}$/;
  private readonly _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(raw: string) {
    const zipCode = this.sanitize(raw);

    if (!this.validate(zipCode)) {
      throw new InvalidZipCodeError(raw);
    }

    this._value = zipCode;
  }

  private sanitize(zipCode: string): string {
    return typeof zipCode === 'string' ? zipCode.replace(/[\s.-]/g, '') : '';
  }

  private validate(zipCode: string): boolean {
    if (!zipCode) return false;

    return this.FORMAT.test(zipCode);
  }
}
