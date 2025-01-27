import * as bcrypt from 'bcrypt';

export class Password {
  public static hash(password: string): string {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  }

  public static compare(plain: string, hash: string): boolean {
    return bcrypt.compareSync(plain, hash);
  }

  public static generateRandom(): string {
    return Math.random().toString(36).slice(-8);
  }
}
