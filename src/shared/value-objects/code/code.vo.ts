import { randomInt } from 'crypto';
import { InvalidExpirationTimeError } from './code.error';

export class Code {
  private readonly SECONDS_IN_A_MINUTE = 60;
  private readonly MILISECONDS_IN_A_SECOND = 1000;
  private readonly _value: string;
  private readonly _expiresIn: number;

  public get value(): { code: string; expiresIn: number } {
    return {
      code: this._value,
      expiresIn: this._expiresIn,
    };
  }

  constructor(expirationTimeInMinutes: number) {
    if (expirationTimeInMinutes <= 0) {
      throw new InvalidExpirationTimeError();
    }

    this._value = this.generateCode();
    this._expiresIn = Date.now() + this.minutesToMiliseconds(expirationTimeInMinutes);
  }

  private minutesToMiliseconds(minutes: number): number {
    return minutes * this.SECONDS_IN_A_MINUTE * this.MILISECONDS_IN_A_SECOND;
  }

  private generateCode(): string {
    return Array.from({ length: 6 }, () => randomInt(0, 10)).join('');
  }
}
