import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AccountPrismaAdapterDao } from './account-prisma.dao';

function makeAccount(overrides: Partial<Prisma.AccountUncheckedCreateInput> = {}): Prisma.AccountCreateInput {
  return {
    email: 'jhondoe@email.com',
    password: 'hashed-password',
    status: AccountStatus.ACTIVE,
    roles: { create: { role: AccountRole.STUDENT } },
    ...overrides,
  };
}

describe('AccountPrismaAdapterDao - Integration tests', () => {
  let sut: AccountPrismaAdapterDao;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule,
      ],
      providers: [
        AccountPrismaAdapterDao,
        PrismaService,
      ],
    }).compile();

    sut = module.get(AccountPrismaAdapterDao);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.account.deleteMany();
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  describe('findByCredential', () => {
    it('should return the account with sensitive data when found by email', async() => {
      // Arrange
      const account = await prisma.account.create({ data: makeAccount() });

      // Act
      const result = await sut.findByCredential(account.email);

      // Assert
      expect(result).toEqual({
        id: account.id,
        email: account.email,
        password: account.password,
        passwordResetToken: account.passwordResetToken,
        status: AccountStatus.ACTIVE,
        roles: [AccountRole.STUDENT],
      });
    });

    it('should return null when no account matches the credential', async() => {
      // Act
      const result = await sut.findByCredential('missing@email.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return the account with sensitive data when found by email', async() => {
      // Arrange
      const account = await prisma.account.create({ data: makeAccount() });

      // Act
      const result = await sut.findByEmail(account.email);

      // Assert
      expect(result).toEqual({
        id: account.id,
        email: account.email,
        password: account.password,
        passwordResetToken: account.passwordResetToken,
        status: AccountStatus.ACTIVE,
        roles: [AccountRole.STUDENT],
      });
    });

    it('should return null when no account matches the email', async() => {
      // Act
      const result = await sut.findByEmail('missing@email.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return the account without sensitive data when found by id', async() => {
      // Arrange
      const account = await prisma.account.create({ data: makeAccount() });

      // Act
      const result = await sut.findById(account.id);

      // Assert
      expect(result).toEqual({
        id: account.id,
        email: account.email,
        status: AccountStatus.ACTIVE,
        roles: [AccountRole.STUDENT],
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('passwordResetToken');
    });

    it('should return null when no account matches the id', async() => {
      // Act
      const result = await sut.findById('00000000-0000-0000-0000-000000000000');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('forgotPassword', () => {
    it('should persist the password reset token for the account', async() => {
      // Arrange
      const account = await prisma.account.create({ data: makeAccount() });

      // Act
      await sut.forgotPassword(account.id, 'reset-token');

      // Assert
      const updated = await prisma.account.findUniqueOrThrow({ where: { id: account.id } });
      expect(updated.passwordResetToken).toBe('reset-token');
    });
  });

  describe('resetPassword', () => {
    it('should persist the new password and clear the reset token', async() => {
      // Arrange
      const account = await prisma.account.create({
        data: makeAccount({ passwordResetToken: 'reset-token' }),
      });

      // Act
      await sut.resetPassword(account.id, 'new-hashed-password');

      // Assert
      const updated = await prisma.account.findUniqueOrThrow({ where: { id: account.id } });
      expect(updated.password).toBe('new-hashed-password');
      expect(updated.passwordResetToken).toBeNull();
    });
  });
});
