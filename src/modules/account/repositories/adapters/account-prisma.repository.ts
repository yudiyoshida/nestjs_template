import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { IAccountRepository } from '../account-repository.interface';

@Injectable()
export class AccountPrismaAdapterRepository implements IAccountRepository {
  constructor(private prisma: PrismaService) {}

  public findByEmail(email: string) {
    return this.prisma.account.findUnique({
      where: { email },
      include: { permissions: true },
    });
  }

  public findById(id: string) {
    return this.prisma.account.findUnique({
      where: { id },
      include: { permissions: true },
    });
  }

  public save(
    data: Prisma.AccountCreateWithoutPermissionsInput,
    permissions: Prisma.AccountPermissionCreateInput[]
  ) {
    return this.prisma.account.create({
      data: {
        ...data,
        permissions: {
          createMany: { data: permissions },
        },
      },
      include: { permissions: true },
    });
  }
}
