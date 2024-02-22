import { Injectable } from '@nestjs/common';
import { IHashingService } from '../hashing.interface';

import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptAdapterService implements IHashingService {
  public compare(text: string, hashText: string): boolean {
    return bcrypt.compareSync(text, hashText);
  }

  public hash(text: string, saltOrRounds?: string | number): string {
    return bcrypt.hashSync(text, saltOrRounds || 10);
  }
}
