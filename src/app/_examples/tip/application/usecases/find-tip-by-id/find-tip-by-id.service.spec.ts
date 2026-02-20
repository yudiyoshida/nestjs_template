import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { TipType } from 'src/app/_examples/tip/domain/enums/tip-type.enum';
import { TipModule } from 'src/app/_examples/tip/tip.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { TipDto } from '../../dtos/tip.dto';
import { FindTipById } from './find-tip-by-id.service';

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

describe('FindTipById - Integration tests', () => {
  let sut: FindTipById;
  let prisma: PrismaService;
  const accountId = 'admin-user';

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        TipModule,
      ],
    }).compile();

    sut = module.get(FindTipById);
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

  it('should return null when tip does not exist', async() => {
    // Arrange
    const id = 'non-existing-id';

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toBeNull();
  });

  it('should return tip by id', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: { ...makeTip(accountId) },
    });

    // Act
    const result = await sut.execute(tip.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.id).toBe(tip.id);
    expect(result?.title).toBe(tip.title);
  });

  it('should return all tip fields correctly', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: { ...makeTip(accountId) },
    });

    // Act
    const result = await sut.execute(tip.id);

    // Assert
    expect(result).toEqual<TipDto>({
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

  it.each(
    Object.values(TipStatus)
  )('should return tip with status %s', async(status) => {
    // Arrange
    const tip = await prisma.tip.create({
      data: { ...makeTip(accountId, { status }) },
    });

    // Act
    const result = await sut.execute(tip.id);

    // Assert
    expect(result).toEqual<TipDto>({
      id: tip.id,
      type: tip.type as TipType,
      title: tip.title,
      content: tip.content,
      status: status,
      locationId: tip.locationId,
      createdBy: tip.createdBy,
      expiresAt: tip.expiresAt,
      createdAt: tip.createdAt,
      updatedAt: tip.updatedAt,
    });
  });

  it.each(
    Object.values(TipType)
  )('should return %s tip', async(type) => {
    // Arrange
    const tip = await prisma.tip.create({
      data: { ...makeTip(accountId, { type }) },
    });

    // Act
    const result = await sut.execute(tip.id);

    // Assert
    expect(result).toEqual<TipDto>({
      id: tip.id,
      type: type,
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
