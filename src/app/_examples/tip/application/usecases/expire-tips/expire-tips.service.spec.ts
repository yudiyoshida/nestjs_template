import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { TipType } from 'src/app/_examples/tip/domain/enums/tip-type.enum';
import { TipModule } from 'src/app/_examples/tip/tip.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ExpireTips } from './expire-tips.service';

function makeTip(accountId: string, overrides: Partial<Prisma.TipCreateInput> = {}): Prisma.TipCreateInput {
  return {
    title: 'Ventos fortes',
    content: 'Rajadas podem chegar a 60 km/h',
    type: TipType.WEATHER,
    status: TipStatus.ACTIVE,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    createdBy: accountId,
    ...overrides,
  };
}

describe('ExpireTips - Integration tests', () => {
  let sut: ExpireTips;
  let prisma: PrismaService;
  const accountId = 'admin-user';

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        TipModule,
      ],
    }).compile();

    sut = module.get(ExpireTips);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.tip.deleteMany();
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should not process any tips when no tips exist', async() => {
    // Act
    await sut.execute();

    // Assert
    const count = await prisma.tip.count();
    expect(count).toBe(0);
  });

  it('should expire ACTIVE weather tip that has already expired', async() => {
    // Arrange
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 25); // 25 hours ago
    const tip = await prisma.tip.create({
      data: makeTip(accountId, {
        type: TipType.WEATHER,
        status: TipStatus.ACTIVE,
        expiresAt: expiredDate,
      }),
    });

    // Act
    await sut.execute();

    // Assert
    const updatedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(updatedTip?.status).toBe(TipStatus.EXPIRED);
  });

  it('should not expire ACTIVE weather tip that has not expired yet', async() => {
    // Arrange
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours in future
    const tip = await prisma.tip.create({
      data: makeTip(accountId, {
        type: TipType.WEATHER,
        status: TipStatus.ACTIVE,
        expiresAt: futureDate,
      }),
    });

    // Act
    await sut.execute();

    // Assert
    const updatedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(updatedTip?.status).toBe(TipStatus.ACTIVE);
  });

  it('should not expire tip that is already EXPIRED', async() => {
    // Arrange
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 25);
    const tip = await prisma.tip.create({
      data: makeTip(accountId, {
        type: TipType.WEATHER,
        status: TipStatus.EXPIRED,
        expiresAt: expiredDate,
      }),
    });
    const originalUpdatedAt = tip.updatedAt;

    await new Promise(resolve => setTimeout(resolve, 10));

    // Act
    await sut.execute();

    // Assert
    const updatedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(updatedTip?.status).toBe(TipStatus.EXPIRED);
    expect(updatedTip?.updatedAt.getTime()).toBe(originalUpdatedAt.getTime());
  });

  it('should not expire tip that is REMOVED', async() => {
    // Arrange
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 25);
    const tip = await prisma.tip.create({
      data: makeTip(accountId, {
        type: TipType.WEATHER,
        status: TipStatus.REMOVED,
        expiresAt: expiredDate,
      }),
    });

    // Act
    await sut.execute();

    // Assert
    const updatedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(updatedTip?.status).toBe(TipStatus.REMOVED);
  });

  it('should not process LOCAL tips', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId, {
        type: TipType.LOCAL,
        status: TipStatus.ACTIVE,
        expiresAt: null,
      }),
    });

    // Act
    await sut.execute();

    // Assert
    const updatedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(updatedTip?.status).toBe(TipStatus.ACTIVE);
  });

  it('should expire multiple expired weather tips', async() => {
    // Arrange
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 25);
    const tip1 = await prisma.tip.create({
      data: makeTip(accountId, {
        title: 'Tip 1',
        type: TipType.WEATHER,
        status: TipStatus.ACTIVE,
        expiresAt: expiredDate,
      }),
    });
    const tip2 = await prisma.tip.create({
      data: makeTip(accountId, {
        title: 'Tip 2',
        type: TipType.WEATHER,
        status: TipStatus.ACTIVE,
        expiresAt: expiredDate,
      }),
    });

    // Act
    await sut.execute();

    // Assert
    const updatedTip1 = await prisma.tip.findUnique({ where: { id: tip1.id } });
    const updatedTip2 = await prisma.tip.findUnique({ where: { id: tip2.id } });
    expect(updatedTip1?.status).toBe(TipStatus.EXPIRED);
    expect(updatedTip2?.status).toBe(TipStatus.EXPIRED);
  });

  it('should update updatedAt timestamp when expiring tip', async() => {
    // Arrange
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 25);
    const tip = await prisma.tip.create({
      data: makeTip(accountId, {
        type: TipType.WEATHER,
        status: TipStatus.ACTIVE,
        expiresAt: expiredDate,
      }),
    });
    const originalUpdatedAt = tip.updatedAt;

    await new Promise(resolve => setTimeout(resolve, 10));

    // Act
    await sut.execute();

    // Assert
    const updatedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(updatedTip?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should not change other tip properties when expiring', async() => {
    // Arrange
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 25);
    const tip = await prisma.tip.create({
      data: makeTip(accountId, {
        type: TipType.WEATHER,
        status: TipStatus.ACTIVE,
        expiresAt: expiredDate,
      }),
    });

    // Act
    await sut.execute();

    // Assert
    const updatedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(updatedTip).toEqual({
      ...tip,
      status: TipStatus.EXPIRED,
      updatedAt: expect.any(Date),
    });
  });

  it('should handle mixed scenario with expired and active tips', async() => {
    // Arrange
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 25);
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const expiredTip = await prisma.tip.create({
      data: makeTip(accountId, {
        title: 'Expired Tip',
        type: TipType.WEATHER,
        status: TipStatus.ACTIVE,
        expiresAt: expiredDate,
      }),
    });

    const activeTip = await prisma.tip.create({
      data: makeTip(accountId, {
        title: 'Active Tip',
        type: TipType.WEATHER,
        status: TipStatus.ACTIVE,
        expiresAt: futureDate,
      }),
    });

    // Act
    await sut.execute();

    // Assert
    const updatedExpiredTip = await prisma.tip.findUnique({ where: { id: expiredTip.id } });
    const updatedActiveTip = await prisma.tip.findUnique({ where: { id: activeTip.id } });
    expect(updatedExpiredTip?.status).toBe(TipStatus.EXPIRED);
    expect(updatedActiveTip?.status).toBe(TipStatus.ACTIVE);
  });

  it('should execute successfully even when no tips need expiring', async() => {
    // Arrange
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await prisma.tip.create({
      data: makeTip(accountId, {
        type: TipType.WEATHER,
        status: TipStatus.ACTIVE,
        expiresAt: futureDate,
      }),
    });

    // Act & Assert
    await expect(sut.execute()).resolves.toBeUndefined();
  });
});
