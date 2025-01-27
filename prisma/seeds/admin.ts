import { AccountRole, AccountStatus, Permission, Prisma, PrismaClient } from '@prisma/client';
import { Password } from '../../src/shared/value-objects/password/password.vo';

export class AdminSeed {
  private static data: Prisma.AdminCreateInput[] = [
    {
      name: 'Admin Master',
      cpf: '12345678909',
      account: {
        create: {
          role: AccountRole.ADMIN,
          email: 'admin@email.com',
          password: Password.hash('admin123'),
          status: AccountStatus.ACTIVE,
        },
      },
      permissions: {
        create: [
          { title: Permission.DASHBOARD },
          { title: Permission.USUÁRIOS },
          { title: Permission.ALIMENTOS },
          { title: Permission.BANNERS },
          { title: Permission.FINANCEIRO },
          { title: Permission.ACESSOS },
        ],
      },
    },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    for (const data of this.data) {
      await prisma.admin.create({
        data,
      });
    }

    console.log('Admins seeded');
  }
}
