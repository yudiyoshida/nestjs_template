import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;

  public compare(plain: string, hash: string): boolean {
    return bcrypt.compareSync(plain, hash);
  }

  public hashPassword(password: string): string {
    const salt = this.generateSalt(this.saltRounds);
    return bcrypt.hashSync(password, salt);
  }

  private generateSalt(salt: number): string {
    return bcrypt.genSaltSync(salt);
  }
}
