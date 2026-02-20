import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { TipType } from 'src/app/_examples/tip/domain/enums/tip-type.enum';
import { TipCannotBeEditedError, TipNotFoundError } from 'src/app/_examples/tip/domain/errors/tip.error';
import { TipModule } from 'src/app/_examples/tip/tip.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditTipInputDto } from './dtos/edit-tip.dto';
import { EditTip } from './edit-tip.service';

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

describe('EditTip - Integration tests', () => {
  let sut: EditTip;
  let prisma: PrismaService;
  const accountId = 'admin-user';
  const anotherAccountId = 'user-456';

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        TipModule,
      ],
    }).compile();

    sut = module.get(EditTip);
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
    const data: EditTipInputDto = { title: 'Updated' };

    // Act & Assert
    await expect(sut.execute(id, data, accountId)).rejects.toThrow(TipNotFoundError);
  });

  it('should throw TipNotFoundError when user is not the creator', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId),
    });
    const data: EditTipInputDto = { title: 'Updated' };

    // Act & Assert
    await expect(sut.execute(tip.id, data, anotherAccountId)).rejects.toThrow(TipNotFoundError);
  });

  it('should allow admin to edit any tip', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId),
    });
    const data: EditTipInputDto = { title: 'Updated' };

    // Act
    await sut.execute(tip.id, data);

    // Assert
    const updatedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(updatedTip?.title).toBe('Updated');
  });

  it.each(
    Object.values(TipStatus).filter(status => status !== TipStatus.ACTIVE)
  )('should throw TipCannotBeEditedError when tip is %s', async(status) => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId, { status }),
    });
    const data: EditTipInputDto = { title: 'Updated' };

    // Act & Assert
    await expect(sut.execute(tip.id, data, accountId)).rejects.toThrow(TipCannotBeEditedError);
  });

  it('should update tip title and content', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId),
    });
    const data: EditTipInputDto = {
      title: 'Updated Title',
      content: 'Updated Content',
    };

    // Act
    await sut.execute(tip.id, data, accountId);

    // Assert
    const updatedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(updatedTip).toEqual({
      ...tip,
      title: 'Updated Title',
      content: 'Updated Content',
      updatedAt: expect.any(Date),
    });
  });

  it('should update only title when content is not provided', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId, { content: 'Original Content' }),
    });
    const data: EditTipInputDto = { title: 'Updated Title' };

    // Act
    await sut.execute(tip.id, data, accountId);

    // Assert
    const updatedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(updatedTip).toEqual({
      ...tip,
      title: 'Updated Title',
      updatedAt: expect.any(Date),
    });
  });

  it('should update only content when title is not provided', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId, { title: 'Original Title' }),
    });
    const data: EditTipInputDto = { content: 'Updated Content' };

    // Act
    await sut.execute(tip.id, data, accountId);

    // Assert
    const updatedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(updatedTip).toEqual({
      ...tip,
      content: 'Updated Content',
      updatedAt: expect.any(Date),
    });
  });

  it('should update updatedAt timestamp', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId),
    });
    const originalUpdatedAt = tip.updatedAt;

    await new Promise(resolve => setTimeout(resolve, 10));

    const data: EditTipInputDto = { title: 'Updated' };

    // Act
    await sut.execute(tip.id, data, accountId);

    // Assert
    const updatedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(updatedTip?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should allow creator to edit their own tip', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId),
    });
    const data: EditTipInputDto = { title: 'Updated by Creator' };

    // Act
    const result = await sut.execute(tip.id, data, accountId);

    // Assert
    expect(result.message).toBe('Dica atualizada com sucesso');
    const updatedTip = await prisma.tip.findUnique({ where: { id: tip.id } });
    expect(updatedTip?.title).toBe('Updated by Creator');
  });

  it('should return success message', async() => {
    // Arrange
    const tip = await prisma.tip.create({
      data: makeTip(accountId),
    });
    const data: EditTipInputDto = { title: 'Updated' };

    // Act
    const result = await sut.execute(tip.id, data, accountId);

    // Assert
    expect(result).toEqual({ message: 'Dica atualizada com sucesso' });
  });

  it('should not save changes if tip does not exist', async() => {
    // Arrange
    const id = 'non-existing-id';
    const data: EditTipInputDto = { title: 'Updated' };

    // Act & Assert
    await expect(sut.execute(id, data, accountId)).rejects.toThrow();
    const count = await prisma.tip.count();
    expect(count).toBe(0);
  });

  it('should not affect other tips when editing one', async() => {
    // Arrange
    const tip1 = await prisma.tip.create({
      data: makeTip(accountId, { title: 'Tip 1' }),
    });
    const tip2 = await prisma.tip.create({
      data: makeTip(accountId, { title: 'Tip 2' }),
    });

    // Act
    await sut.execute(tip1.id, { title: 'Updated Tip 1' });

    // Assert
    const updatedTip1 = await prisma.tip.findUnique({ where: { id: tip1.id } });
    const updatedTip2 = await prisma.tip.findUnique({ where: { id: tip2.id } });
    expect(updatedTip1).toEqual({
      ...tip1,
      title: 'Updated Tip 1',
      updatedAt: expect.any(Date),
    });
    expect(updatedTip2).toEqual(tip2);
  });
});
