import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma.service';

@Injectable()
export class AuthenticationDao {
  constructor(private prisma: PrismaService) {}

  public findByCredential(credential: string) {
    return this.prisma.account.findUnique({
      where: {
        email: credential,
      },
    });
  }
}
