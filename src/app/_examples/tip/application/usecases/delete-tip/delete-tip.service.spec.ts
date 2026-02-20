import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { TipType } from 'src/app/_examples/tip/domain/enums/tip-type.enum';
import { TipNotFoundError } from 'src/app/_examples/tip/domain/errors/tip.error';
import { TipModule } from 'src/app/_examples/tip/tip.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteTip } from './delete-tip.service';

function makeTip(_accountId: string, overrides: Partial<Prisma.TipCreateInput> = {}): Prisma.TipCreateInput {
  return {
    title: 'Ventos fortes',
    content: 'Rajadas podem chegar a 60 km/h',
    type: TipType.WEATHER,
    status: TipStatus.ACTIVE,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    createdBy: 'admin-user',
    ...overrides,
  };
}

describe('DeleteTip - Integration tests', () => {
  let sut: DeleteTip;
  let prisma: PrismaService;
  const accountId = 'admin-user';
  const anotherAccountId = 'user-456';

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        TipModule,
      ],
    }).compile();

    sut = module.get(DeleteTip);
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

  it('should throw TipNotFoundError when tip does not exist', async() => {
    // Arrange
    const id = 'non-existing-id';

    // Act & Assert
    await expect(sut.execute(id, accountId)).rejects.toThrow(TipNotFoundError);
  });

  it('should throw TipNotFoundError when user is not creator and not admin', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId),
    });

    // Act & Assert
    await expect(sut.execute(tip.id, anotherAccountId)).rejects.toThrow(TipNotFoundError);
  });

  it('should allow creator to delete their own tip', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId),
    });

    // Act
    await sut.execute(tip.id, accountId);

    // Assert
    const deletedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(deletedTip).toBeNull();
  });

  it('should allow admin to delete any tip', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId),
    });

    // Act
    await sut.execute(tip.id);

    // Assert
    const deletedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(deletedTip).toBeNull();
  });

  it('should perform hard delete (permanent deletion)', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId),
    });

    // Act
    await sut.execute(tip.id, accountId);

    // Assert
    const count = await prisma.tip.count({ where: { id: tip.id } });
    expect(count).toBe(0);
  });

  it.each(
    Object.values(TipStatus)
  )('should delete %s tip', async(status) => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId, { status }),
    });

    // Act
    await sut.execute(tip.id, accountId);

    // Assert
    const deletedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(deletedTip).toBeNull();
  });

  it('should delete WEATHER tip', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId, { type: TipType.WEATHER }),
    });

    // Act
    await sut.execute(tip.id, accountId);

    // Assert
    const deletedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(deletedTip).toBeNull();
  });

  it('should delete LOCAL tip', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId, { type: TipType.LOCAL, expiresAt: null }),
    });

    // Act
    await sut.execute(tip.id, accountId);

    // Assert
    const deletedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(deletedTip).toBeNull();
  });

  it('should return success message', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId),
    });

    // Act
    const result = await sut.execute(tip.id, accountId);

    // Assert
    expect(result).toEqual({ message: 'Dica excluída com sucesso' });
  });

  it('should not delete if tip does not exist', async() => {
    // Arrange
    const id = 'non-existing-id';

    // Act & Assert
    await expect(sut.execute(id, accountId)).rejects.toThrow(TipNotFoundError);
  });

  it('should delete multiple tips independently', async() => {
    // Arrange
    const tip1 = await prisma.tip.create({
      data: makeTip(accountId, { title: 'Tip 1' }),
    });
    const tip2 = await prisma.tip.create({
      data: makeTip(accountId, { title: 'Tip 2' }),
    });

    // Act
    await sut.execute(tip1.id, accountId);

    // Assert
    const deletedTip1 = await prisma.tip.findUnique({ where: { id: tip1.id } });
    const tip2StillExists = await prisma.tip.findUnique({ where: { id: tip2.id } });
    expect(deletedTip1).toBeNull();
    expect(tip2StillExists).not.toBeNull();
  });

  it('should not delete other tips when deleting one', async() => {
    // Arrange
    const tip1 = await prisma.tip.create({
      data: makeTip(accountId, { title: 'Tip 1' }),
    });
    const tip2 = await prisma.tip.create({
      data: makeTip(accountId, { title: 'Tip 2' }),
    });

    // Act
    await sut.execute(tip1.id, accountId);

    // Assert
    const deletedTip1 = await prisma.tip.findUnique({ where: { id: tip1.id } });
    const tip2StillExists = await prisma.tip.findUnique({ where: { id: tip2.id } });

    expect(deletedTip1).toBeNull();
    expect(tip2StillExists).not.toBeNull();
  });

  it('should verify total count after deletion', async() => {
    // Arrange
    const tip1 = await prisma.tip.create({
      data: makeTip(accountId),
    });

    // Act
    await sut.execute(tip1.id, accountId);

    // Assert
    const count = await prisma.tip.count();
    expect(count).toBe(0);
  });
});
