import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { InvalidPasswordError } from './password.error';

export class Password {
  private readonly saltRounds = 10;
  private readonly _value: string;

  public static compare(plain: string, hash: string): boolean {
    return bcrypt.compareSync(plain, hash);
  }

  public static generateRandom(): string {
    return randomBytes(12).toString('base64url');
  }

  constructor(password: string) {
    if (!this.validate(password)) {
      throw new InvalidPasswordError();
    }

    this._value = this.hashPassword(password);
  }

  private validate(password: string): boolean {
    if (typeof password !== 'string') return false;
    if (!password.trim()) return false;

    return true;
  }

  private hashPassword(password: string): string {
    const salt = this.generateSalt(this.saltRounds);
    return bcrypt.hashSync(password, salt);
  }

  private generateSalt(salt: number): string {
    return bcrypt.genSaltSync(salt);
  }

  public get value(): string {
    return this._value;
  }
}
