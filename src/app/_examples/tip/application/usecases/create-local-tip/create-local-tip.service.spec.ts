import { Test } from '@nestjs/testing';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { TipType } from 'src/app/_examples/tip/domain/enums/tip-type.enum';
import { TipModule } from 'src/app/_examples/tip/tip.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateLocalTip } from './create-local-tip.service';
import { CreateLocalTipInputDto } from './dtos/create-local-tip.dto';

function makeValidInput(overrides: Partial<CreateLocalTipInputDto> = {}): CreateLocalTipInputDto {
  return {
    title: 'Pouso requer atenção',
    content: 'Pista principal tem buracos no setor norte.',
    locationId: 'Aeroporto de Congonhas',
    ...overrides,
  };
}

describe('CreateLocalTip - Integration tests', () => {
  let sut: CreateLocalTip;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        TipModule,
      ],
    }).compile();

    sut = module.get(CreateLocalTip);
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

  it('should create local tip and persist in database with ACTIVE status', async() => {
    // Arrange
    const input = makeValidInput();
    const createdBy = 'user-123';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    expect(result.id).toBeDefined();

    // Verify persistence
    const savedTip = await prisma.tip.findUnique({
      where: { id: result.id },
    });
    expect(savedTip).not.toBeNull();
    expect(savedTip?.title).toBe(input.title);
    expect(savedTip?.type).toBe(TipType.LOCAL);
    expect(savedTip?.status).toBe(TipStatus.ACTIVE);
  });

  it('should save tip with all correct fields', async() => {
    // Arrange
    const input = makeValidInput({
      title: 'Test Local Tip',
      content: 'Test content for local tip',
      locationId: 'Santos Dumont Airport',
    });
    const createdBy = 'user-456';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    const savedTip = await prisma.tip.findUnique({
      where: { id: result.id },
    });
    expect(savedTip).toEqual({
      id: result.id,
      type: TipType.LOCAL,
      title: input.title,
      content: input.content,
      status: TipStatus.ACTIVE,
      locationId: input.locationId,
      createdBy,
      expiresAt: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('should set createdBy correctly', async() => {
    // Arrange
    const input = makeValidInput();
    const createdBy = 'admin-user';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    const savedTip = await prisma.tip.findUnique({
      where: { id: result.id },
    });
    expect(savedTip?.createdBy).toBe(createdBy);
  });

  it('should set locationId correctly', async() => {
    // Arrange
    const input = makeValidInput({ locationId: 'Custom Airport Name' });
    const createdBy = 'user-789';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    const savedTip = await prisma.tip.findUnique({
      where: { id: result.id },
    });
    expect(savedTip?.locationId).toBe('Custom Airport Name');
  });

  it('should set expiresAt as null', async() => {
    // Arrange
    const input = makeValidInput();
    const createdBy = 'user-101';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    const savedTip = await prisma.tip.findUnique({
      where: { id: result.id },
    });
    expect(savedTip?.expiresAt).toBeNull();
  });

  it('should accept any string as locationId', async() => {
    // Arrange
    const input = makeValidInput({ locationId: 'Any location name here' });
    const createdBy = 'user-202';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    const savedTip = await prisma.tip.findUnique({
      where: { id: result.id },
    });
    expect(savedTip?.locationId).toBe('Any location name here');
  });

  it('should generate valid UUID for id', async() => {
    // Arrange
    const input = makeValidInput();
    const createdBy = 'user-303';

    // Act
    const result = await sut.execute(input, createdBy);

    // Assert
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(result.id).toMatch(uuidRegex);
  });

  it('should save timestamps correctly', async() => {
    // Arrange
    const input = makeValidInput();
    const createdBy = 'user-404';

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

  it('should create multiple independent local tips', async() => {
    // Arrange
    const input1 = makeValidInput({ title: 'Tip 1', locationId: 'Aeroporto 1' });
    const input2 = makeValidInput({ title: 'Tip 2', locationId: 'Aeroporto 2' });
    const createdBy = 'user-505';

    // Act
    const result1 = await sut.execute(input1, createdBy);
    const result2 = await sut.execute(input2, createdBy);

    // Assert
    expect(result1.id).not.toBe(result2.id);
    const count = await prisma.tip.count();
    expect(count).toBe(2);
  });
});
