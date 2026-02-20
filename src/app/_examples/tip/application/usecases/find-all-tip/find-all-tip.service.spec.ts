import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { TipType } from 'src/app/_examples/tip/domain/enums/tip-type.enum';
import { TipModule } from 'src/app/_examples/tip/tip.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { TipDto } from '../../dtos/tip.dto';
import { FindAllTipQueryDto } from './dtos/find-all-tip-query.dto';
import { FindAllTip } from './find-all-tip.service';

function makeTip(accountId: string, overrides: Partial<Prisma.TipCreateInput> = {}): Prisma.TipUncheckedCreateInput {
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

describe('FindAllTip - Integration tests', () => {
  let sut: FindAllTip;
  let prisma: PrismaService;
  const accountId = 'admin-user';

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        TipModule,
      ],
    }).compile();

    sut = module.get(FindAllTip);
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

  it('should return empty results when no tips exist', async() => {
    // Arrange
    const query: FindAllTipQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all tips with default pagination', async() => {
    // Arrange
    await prisma.tip.createMany({
      data: [
        { ...makeTip(accountId, { title: 'Tip 1' }) },
        { ...makeTip(accountId, { title: 'Tip 2' }) },
        { ...makeTip(accountId, { title: 'Tip 3' }) },
      ],
    });
    const query: FindAllTipQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
  });

  it('should paginate results correctly', async() => {
    // Arrange
    await prisma.tip.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        ...makeTip(accountId, { title: `Tip ${i + 1}` }),
        createdBy: accountId,
        locationId: null,
      })),
    });

    // Act
    const page1 = await sut.execute({ page: 1, size: 10 });
    const page3 = await sut.execute({ page: 3, size: 10 });

    // Assert
    expect(page1.data).toHaveLength(10);
    expect(page1.totalItems).toBe(25);
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(3);

    expect(page3.data).toHaveLength(5);
    expect(page3.totalItems).toBe(25);
    expect(page3.currentPage).toBe(3);
  });

  it('should filter by type WEATHER', async() => {
    // Arrange
    await prisma.tip.createMany({
      data: [
        { ...makeTip(accountId, { type: TipType.WEATHER }) },
        { ...makeTip(accountId, { type: TipType.LOCAL, expiresAt: null }) },
      ],
    });
    const query: FindAllTipQueryDto = { type: TipType.WEATHER };

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].type).toBe(TipType.WEATHER);
  });

  it('should filter by type LOCAL', async() => {
    // Arrange
    await prisma.tip.createMany({
      data: [
        { ...makeTip(accountId, { type: TipType.WEATHER }) },
        { ...makeTip(accountId, { type: TipType.LOCAL, expiresAt: null }) },
        { ...makeTip(accountId, { type: TipType.LOCAL, expiresAt: null }) },
      ],
    });
    const query: FindAllTipQueryDto = { type: TipType.LOCAL };

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every(t => t.type === TipType.LOCAL)).toBe(true);
  });

  it('should filter by status ACTIVE', async() => {
    // Arrange
    await prisma.tip.createMany({
      data: [
        { ...makeTip(accountId, { status: TipStatus.ACTIVE }) },
        { ...makeTip(accountId, { status: TipStatus.EXPIRED }) },
      ],
    });
    const query: FindAllTipQueryDto = { status: TipStatus.ACTIVE };

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].status).toBe(TipStatus.ACTIVE);
  });

  it('should filter by status EXPIRED', async() => {
    // Arrange
    await prisma.tip.createMany({
      data: [
        { ...makeTip(accountId, { status: TipStatus.ACTIVE }) },
        { ...makeTip(accountId, { status: TipStatus.EXPIRED }) },
        { ...makeTip(accountId, { status: TipStatus.EXPIRED }) },
      ],
    });
    const query: FindAllTipQueryDto = { status: TipStatus.EXPIRED };

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every(t => t.status === TipStatus.EXPIRED)).toBe(true);
  });

  it('should filter by locationId', async() => {
    // Arrange
    const locationId = '123e4567-e89b-12d3-a456-426614174000';
    await prisma.tip.createMany({
      data: [
        { ...makeTip(accountId), locationId },
        { ...makeTip(accountId), locationId: null },
      ],
    });
    const query: FindAllTipQueryDto = { locationId };

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].locationId).toBe(locationId);
  });

  it('should search in title field (case-insensitive)', async() => {
    // Arrange
    await prisma.tip.createMany({
      data: [
        { ...makeTip(accountId, { title: 'Ventos Fortes Hoje' }) },
        { ...makeTip(accountId, { title: 'Pista em Manutenção' }) },
      ],
    });
    const query: FindAllTipQueryDto = { search: 'ventos' };

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].title).toBe('Ventos Fortes Hoje');
  });

  it('should search in content field (case-insensitive)', async() => {
    // Arrange
    await prisma.tip.createMany({
      data: [
        { ...makeTip(accountId, { content: 'Rajadas podem chegar a 60 km/h' }) },
        { ...makeTip(accountId, { content: 'Pista está fechada' }) },
      ],
    });
    const query: FindAllTipQueryDto = { search: 'rajadas' };

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].content).toBe('Rajadas podem chegar a 60 km/h');
  });

  it('should combine type and status filters', async() => {
    // Arrange
    await prisma.tip.createMany({
      data: [
        { ...makeTip(accountId, { type: TipType.WEATHER, status: TipStatus.ACTIVE }) },
        { ...makeTip(accountId, { type: TipType.WEATHER, status: TipStatus.EXPIRED }) },
        { ...makeTip(accountId, { type: TipType.LOCAL, status: TipStatus.ACTIVE, expiresAt: null }) },
      ],
    });
    const query: FindAllTipQueryDto = {
      type: TipType.WEATHER,
      status: TipStatus.ACTIVE,
    };

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].type).toBe(TipType.WEATHER);
    expect(result.data[0].status).toBe(TipStatus.ACTIVE);
  });

  it('should return results ordered by createdAt desc', async() => {
    // Arrange
    const tip1 = await prisma.tip.create({
      data: { ...makeTip(accountId, { title: 'First' }) },
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    const tip2 = await prisma.tip.create({
      data: { ...makeTip(accountId, { title: 'Second' }) },
    });
    const query: FindAllTipQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.data[0].id).toBe(tip2.id); // Most recent first
    expect(result.data[1].id).toBe(tip1.id);
  });

  it('should return all tip fields correctly', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: { ...makeTip(accountId) },
    });
    const query: FindAllTipQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual<TipDto>({
      id: tip.id,
      type: tip.type as TipType,
      title: tip.title,
      content: tip.content,
      status: tip.status as TipStatus,
      locationId: tip.locationId,
      createdBy: tip.createdBy,
      expiresAt: tip.expiresAt,
      createdAt: tip.createdAt,
      updatedAt: tip.updatedAt,
    });
  });
});
