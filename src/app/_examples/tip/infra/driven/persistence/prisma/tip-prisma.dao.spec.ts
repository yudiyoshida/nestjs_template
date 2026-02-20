import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { TipDto } from 'src/app/_examples/tip/application/dtos/tip.dto';
import { FindAllTipQueryDto } from 'src/app/_examples/tip/application/usecases/find-all-tip/dtos/find-all-tip-query.dto';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { TipType } from 'src/app/_examples/tip/domain/enums/tip-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { TipPrismaAdapterDao } from './tip-prisma.dao';

function makeTip(overrides: Partial<Prisma.TipCreateInput> = {}): Prisma.TipUncheckedCreateInput {
  return {
    title: 'Tip 1',
    content: 'Content 1',
    type: TipType.WEATHER,
    status: TipStatus.ACTIVE,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    createdBy: 'admin-user',
    ...overrides,
  };
}

describe('TipPrismaAdapterDao - Integration tests', () => {
  let sut: TipPrismaAdapterDao;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule,
      ],
      providers: [
        TipPrismaAdapterDao,
        PrismaService,
      ],
    }).compile();

    sut = module.get(TipPrismaAdapterDao);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.tip.deleteMany();
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no tips exist', async() => {
      // Arrange
      const query: FindAllTipQueryDto = {};

      // Act
      const [tips, total] = await sut.findAll(query);

      // Assert
      expect(tips).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all tips with default pagination', async() => {
      // Arrange
      await prisma.tip.createMany({
        data: [
          { ...makeTip() },
          { ...makeTip() },
        ],
      });
      const query: FindAllTipQueryDto = {};

      // Act
      const [tips, total] = await sut.findAll(query);

      // Assert
      expect(tips).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.tip.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          ...makeTip({ title: `Tip ${i + 1}` }),
        })),
      });

      // Act
      const [tips, total] = await sut.findAll({ page: 1, size: 10 });
      expect(tips).toHaveLength(10);
      expect(total).toBe(25);

      const [tips2, total2] = await sut.findAll({ page: 3, size: 10 });
      expect(tips2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by type WEATHER', async() => {
      // Arrange
      await prisma.tip.createMany({
        data: [
          { ...makeTip({ type: TipType.WEATHER }) },
          { ...makeTip({ type: TipType.LOCAL }) },
        ],
      });
      const query: FindAllTipQueryDto = { type: TipType.WEATHER };

      // Act
      const [tips, total] = await sut.findAll(query);

      // Assert
      expect(tips).toHaveLength(1);
      expect(total).toBe(1);
      expect(tips[0].type).toBe(TipType.WEATHER);
    });

    it('should filter by type LOCAL', async() => {
      // Arrange
      await prisma.tip.createMany({
        data: [
          { ...makeTip({ type: TipType.WEATHER }) },
          { ...makeTip({ type: TipType.LOCAL }) },
          { ...makeTip({ type: TipType.LOCAL }) },
        ],
      });
      const query: FindAllTipQueryDto = { type: TipType.LOCAL };

      // Act
      const [tips, total] = await sut.findAll(query);

      // Assert
      expect(tips).toHaveLength(2);
      expect(total).toBe(2);
      expect(tips.every(t => t.type === TipType.LOCAL)).toBe(true);
    });

    it('should filter by status ACTIVE', async() => {
      // Arrange
      await prisma.tip.createMany({
        data: [
          { ...makeTip({ status: TipStatus.ACTIVE }) },
          { ...makeTip({ status: TipStatus.EXPIRED }) },
        ],
      });
      const query: FindAllTipQueryDto = { status: TipStatus.ACTIVE };

      // Act
      const [tips, total] = await sut.findAll(query);

      // Assert
      expect(tips).toHaveLength(1);
      expect(total).toBe(1);
      expect(tips[0].status).toBe(TipStatus.ACTIVE);
    });

    it('should filter by status EXPIRED', async() => {
      // Arrange
      await prisma.tip.createMany({
        data: [
          { ...makeTip({ status: TipStatus.ACTIVE }) },
          { ...makeTip({ status: TipStatus.EXPIRED }) },
          { ...makeTip({ status: TipStatus.EXPIRED }) },
        ],
      });
      const query: FindAllTipQueryDto = { status: TipStatus.EXPIRED };

      // Act
      const [tips, total] = await sut.findAll(query);

      // Assert
      expect(tips).toHaveLength(2);
      expect(total).toBe(2);
      expect(tips.every(t => t.status === TipStatus.EXPIRED)).toBe(true);
    });

    it('should filter by locationId', async() => {
      // Arrange
      const locationId = 'Aeroporto de Congonhas';
      await prisma.tip.createMany({
        data: [
          { ...makeTip(), locationId },
          { ...makeTip(), locationId: null },
        ],
      });
      const query: FindAllTipQueryDto = { locationId };

      // Act
      const [tips, total] = await sut.findAll(query);

      // Assert
      expect(tips).toHaveLength(1);
      expect(total).toBe(1);
      expect(tips[0].locationId).toBe(locationId);
    });

    it('should search in title field (case-insensitive)', async() => {
      // Arrange
      await prisma.tip.createMany({
        data: [
          { ...makeTip({ title: 'Ventos Fortes Hoje' }) },
          { ...makeTip({ title: 'Pista em Manutenção' }) },
        ],
      });
      const query: FindAllTipQueryDto = { search: 'ventos' };

      // Act
      const [tips, total] = await sut.findAll(query);

      // Assert
      expect(tips).toHaveLength(1);
      expect(total).toBe(1);
      expect(tips[0].title).toBe('Ventos Fortes Hoje');
    });

    it('should search in content field (case-insensitive)', async() => {
      // Arrange
      await prisma.tip.createMany({
        data: [
          { ...makeTip({ content: 'Rajadas podem chegar a 60 km/h' }) },
          { ...makeTip({ content: 'Pista está fechada' }) },
        ],
      });
      const query: FindAllTipQueryDto = { search: 'rajadas' };

      // Act
      const [tips, total] = await sut.findAll(query);

      // Assert
      expect(tips).toHaveLength(1);
      expect(total).toBe(1);
      expect(tips[0].content).toBe('Rajadas podem chegar a 60 km/h');
    });

    it('should combine type and status filters', async() => {
      // Arrange
      await prisma.tip.createMany({
        data: [
          { ...makeTip({ type: TipType.WEATHER, status: TipStatus.ACTIVE }) },
          { ...makeTip({ type: TipType.WEATHER, status: TipStatus.EXPIRED }) },
          { ...makeTip({ type: TipType.LOCAL, status: TipStatus.ACTIVE }) },
        ],
      });
      const query: FindAllTipQueryDto = {
        type: TipType.WEATHER,
        status: TipStatus.ACTIVE,
      };

      // Act
      const [tips, total] = await sut.findAll(query);

      // Assert
      expect(tips).toHaveLength(1);
      expect(total).toBe(1);
      expect(tips[0].type).toBe(TipType.WEATHER);
      expect(tips[0].status).toBe(TipStatus.ACTIVE);
    });

    it('should return results ordered by createdAt desc', async() => {
      // Arrange
      const tip1 = await prisma.tip.create({
        data: { ...makeTip({ title: 'First Tip' }) },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const tip2 = await prisma.tip.create({
        data: { ...makeTip({ title: 'Second Tip' }) },
      });
      const query: FindAllTipQueryDto = {};

      // Act
      const [tips] = await sut.findAll(query);

      // Assert
      expect(tips).toHaveLength(2);
      expect(tips[0].id).toBe(tip2.id); // Most recent first
      expect(tips[1].id).toBe(tip1.id);
    });

    it('should return locationId when tip has location', async() => {
      // Arrange
      const locationId = 'Aeroporto de Congonhas';
      await prisma.tip.create({
        data: { ...makeTip(), locationId },
      });
      const query: FindAllTipQueryDto = {};

      // Act
      const [tips] = await sut.findAll(query);

      // Assert
      expect(tips).toHaveLength(1);
      expect(tips[0].locationId).toBe(locationId);
    });

    it('should return all tip fields correctly', async() => {
      // Arrange
      const locationId = 'Aeroporto de Congonhas';
      const createdTip = await prisma.tip.create({
        data: { ...makeTip(), locationId },
      });
      const query: FindAllTipQueryDto = {};

      // Act
      const [tips] = await sut.findAll(query);

      // Assert
      expect(tips).toHaveLength(1);
      expect(tips[0]).toEqual<TipDto>({
        id: createdTip.id,
        type: createdTip.type as TipType,
        title: createdTip.title,
        content: createdTip.content,
        status: createdTip.status as TipStatus,
        locationId,
        createdBy: createdTip.createdBy,
        expiresAt: createdTip.expiresAt,
        createdAt: createdTip.createdAt,
        updatedAt: createdTip.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when tip does not exist', async() => {
      // Arrange
      const id = 'non-existing-id';

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return tip by id', async() => {
      // Arrange
      const createdTip = await prisma.tip.create({
        data: {
          ...makeTip(),
          title: 'Test Tip',
        },
      });

      // Act
      const result = await sut.findById(createdTip.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(createdTip.id);
      expect(result?.title).toBe('Test Tip');
    });

    it('should return all tip fields correctly', async() => {
      // Arrange
      const createdTip = await prisma.tip.create({
        data: { ...makeTip() },
      });

      // Act
      const result = await sut.findById(createdTip.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<TipDto>({
        id: createdTip.id,
        type: createdTip.type as TipType,
        title: createdTip.title,
        content: createdTip.content,
        status: createdTip.status as TipStatus,
        locationId: null,
        createdBy: createdTip.createdBy,
        expiresAt: createdTip.expiresAt,
        createdAt: createdTip.createdAt,
        updatedAt: createdTip.updatedAt,
      });
    });

    it('should cast type to TipType enum', async() => {
      // Arrange
      const createdTip = await prisma.tip.create({
        data: { ...makeTip({ type: TipType.LOCAL }) },
      });

      // Act
      const result = await sut.findById(createdTip.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.type).toBe(TipType.LOCAL);
    });

    it('should cast status to TipStatus enum', async() => {
      // Arrange
      const createdTip = await prisma.tip.create({
        data: { ...makeTip({ status: TipStatus.REMOVED }) },
      });

      // Act
      const result = await sut.findById(createdTip.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.status).toBe(TipStatus.REMOVED);
    });
  });
});
