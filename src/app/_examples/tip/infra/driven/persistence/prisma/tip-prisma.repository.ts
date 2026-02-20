import { Injectable } from '@nestjs/common';
import { ITipRepository } from 'src/app/_examples/tip/application/persistence/repository/tip-repository.interface';
import { Tip } from 'src/app/_examples/tip/domain/entities/tip.entity';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { TipType } from 'src/app/_examples/tip/domain/enums/tip-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class TipPrismaAdapterRepository implements ITipRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(tip: Tip): Promise<void> {
    await this.prisma.tip.create({
      data: {
        id: tip.props.id,
        type: tip.props.type,
        title: tip.props.title,
        content: tip.props.content,
        status: tip.props.status,
        locationId: tip.props.locationId,
        createdBy: tip.props.createdBy,
        expiresAt: tip.props.expiresAt,
        createdAt: tip.props.createdAt,
        updatedAt: tip.props.updatedAt,
      },
    });
  }

  public async edit(tip: Tip): Promise<void> {
    await this.prisma.tip.update({
      where: {
        id: tip.props.id,
      },
      data: {
        type: tip.props.type,
        title: tip.props.title,
        content: tip.props.content,
        status: tip.props.status,
        locationId: tip.props.locationId,
        createdBy: tip.props.createdBy,
        expiresAt: tip.props.expiresAt,
        updatedAt: tip.props.updatedAt,
      },
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.tip.delete({
      where: { id },
    });
  }

  public async findById(id: string): Promise<Tip | null> {
    const tip = await this.prisma.tip.findUnique({
      where: { id },
    });

    if (!tip) {
      return null;
    }

    return Tip.load({
      id: tip.id,
      type: tip.type as TipType,
      status: tip.status as TipStatus,
      title: tip.title,
      content: tip.content,
      locationId: tip.locationId,
      createdBy: tip.createdBy,
      expiresAt: tip.expiresAt,
      createdAt: tip.createdAt,
      updatedAt: tip.updatedAt,
    });
  }
}
