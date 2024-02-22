import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/database/prisma/prisma.service';
import { AccountPermission } from '../../entities/account-permission.entity';
import { CreateAccountDto } from '../../use-cases/create-account/dtos/create-account.dto';
import { IAccountRepository } from '../account-repository.interface';

@Injectable()
export class AccountPrismaRepository implements IAccountRepository {
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
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
      },
    });
  }

  public save(data: CreateAccountDto, permissions: AccountPermission[]) {
    return this.prisma.account.create({
      data: {
        ...data,
        permissions: {
          createMany: { data: permissions },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }
}
