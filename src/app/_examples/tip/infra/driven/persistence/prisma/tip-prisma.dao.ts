import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TipDto } from 'src/app/_examples/tip/application/dtos/tip.dto';
import { ITipDao } from 'src/app/_examples/tip/application/persistence/dao/tip-dao.interface';
import { FindAllTipQueryDto } from 'src/app/_examples/tip/application/usecases/find-all-tip/dtos/find-all-tip-query.dto';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { TipType } from 'src/app/_examples/tip/domain/enums/tip-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const TipSelect = {
  id: true,
  type: true,
  title: true,
  content: true,
  status: true,
  locationId: true,
  createdBy: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TipSelect;

type TipPayload = Prisma.TipGetPayload<{ select: typeof TipSelect }>;

@Injectable()
export class TipPrismaAdapterDao implements ITipDao {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDto(tip: TipPayload): TipDto {
    return {
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
    };
  }

  public async findAll(query: FindAllTipQueryDto): Promise<[TipDto[], number]> {
    const pagination = this.prisma.paginationFactory(query.page, query.size);

    const where: Prisma.TipWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.search ? {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { content: { contains: query.search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [tips, total] = await Promise.all([
      this.prisma.tip.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: TipSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tip.count({ where }),
    ]);

    return [tips.map(this.mapToDto), total];
  }

  public async findById(id: string): Promise<TipDto | null> {
    const tip = await this.prisma.tip.findUnique({
      where: { id },
      select: TipSelect,
    });

    if (!tip) {
      return null;
    }

    return this.mapToDto(tip);
  }
}
