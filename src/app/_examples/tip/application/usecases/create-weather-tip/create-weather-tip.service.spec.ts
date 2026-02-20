import { Test } from '@nestjs/testing';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { TipType } from 'src/app/_examples/tip/domain/enums/tip-type.enum';
import { TipModule } from 'src/app/_examples/tip/tip.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateWeatherTip } from './create-weather-tip.service';
import { CreateWeatherTipInputDto } from './dtos/create-weather-tip.dto';

function makeValidInput(overrides: Partial<CreateWeatherTipInputDto> = {}): CreateWeatherTipInputDto {
  return {
    title: 'Ventos fortes hoje',
    content: 'Rajadas de vento podem chegar a 60 km/h durante a tarde.',
    locationId: undefined,
    ...overrides,
  };
}

describe('CreateWeatherTip - Integration tests', () => {
  let sut: CreateWeatherTip;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        TipModule,
      ],
    }).compile();

    sut = module.get(CreateWeatherTip);
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

  it('should create weather tip and persist in database with ACTIVE status', async() => {
    // Arrange
    const input = makeValidInput();
    const createdBy = 'admin-user';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    expect(result.id).toBeDefined();
    expect(result.expiresAt).toBeInstanceOf(Date);

    // Verify persistence
    const savedTip = await prisma.tip.findUnique({
      where: { id: result.id },
    });
    expect(savedTip).not.toBeNull();
    expect(savedTip?.title).toBe(input.title);
    expect(savedTip?.type).toBe(TipType.WEATHER);
    expect(savedTip?.status).toBe(TipStatus.ACTIVE);
  });

  it('should save tip with all correct fields', async() => {
    // Arrange
    const input = makeValidInput({
      title: 'Test Weather',
      content: 'Test content for weather tip',
    });
    const createdBy = 'admin-user';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    const savedTip = await prisma.tip.findUnique({
      where: { id: result.id },
    });
    expect(savedTip).toEqual({
      id: result.id,
      type: TipType.WEATHER,
      title: input.title,
      content: input.content,
      status: TipStatus.ACTIVE,
      locationId: null,
      createdBy,
      expiresAt: expect.any(Date),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('should set createdBy with provided value', async() => {
    // Arrange
    const input = makeValidInput();
    const createdBy = 'admin-user-123';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    const savedTip = await prisma.tip.findUnique({
      where: { id: result.id },
    });
    expect(savedTip?.createdBy).toBe(createdBy);
  });

  it('should create tip without locationId', async() => {
    // Arrange
    const input = makeValidInput({ locationId: undefined });
    const createdBy = 'admin-user';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    const savedTip = await prisma.tip.findUnique({
      where: { id: result.id },
    });
    expect(savedTip?.locationId).toBeNull();
  });

  it('should create tip with locationId as string', async() => {
    // Arrange
    const locationId = 'Aeroporto de Congonhas';
    const input = makeValidInput({ locationId });
    const createdBy = 'admin-user';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    const savedTip = await prisma.tip.findUnique({
      where: { id: result.id },
    });
    expect(savedTip?.locationId).toBe(locationId);
  });

  it('should set expiresAt to approximately 24 hours from now', async() => {
    // Arrange
    const input = makeValidInput();
    const createdBy = 'admin-user';
    const now = new Date();

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    const savedTip = await prisma.tip.findUnique({
      where: { id: result.id },
    });
    const expiresAt = savedTip?.expiresAt;
    expect(expiresAt).toBeInstanceOf(Date);

    const expectedExpiration = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const timeDiff = Math.abs(expiresAt!.getTime() - expectedExpiration.getTime());
    expect(timeDiff).toBeLessThan(2000); // Less than 2 seconds difference
  });

  it('should generate valid UUID for id', async() => {
    // Arrange
    const input = makeValidInput();
    const createdBy = 'admin-user';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(result.id).toMatch(uuidRegex);
  });

  it('should save timestamps correctly', async() => {
    // Arrange
    const input = makeValidInput();
    const createdBy = 'admin-user';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    const savedTip = await prisma.tip.findUnique({
      where: { id: result.id },
    });
    expect(savedTip?.createdAt).toBeInstanceOf(Date);
    expect(savedTip?.updatedAt).toBeInstanceOf(Date);
    expect(savedTip?.createdAt.getTime()).toBeLessThanOrEqual(savedTip!.updatedAt.getTime());
  });

  it('should create multiple independent weather tips', async() => {
    // Arrange
    const input1 = makeValidInput({ title: 'Tip 1' });
    const input2 = makeValidInput({ title: 'Tip 2' });
    const createdBy = 'admin-user';

    // Act
    const result1 = await sut.execute(input1, createdBy);
    const result2 = await sut.execute(input2, createdBy);

    // Assert
    expect(result1.id).not.toBe(result2.id);
    const count = await prisma.tip.count();
    expect(count).toBe(2);
  });
});
