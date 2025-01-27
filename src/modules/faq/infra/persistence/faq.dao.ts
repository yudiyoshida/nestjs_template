import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infra/database/prisma.service';
import { CreateFaqInputDto } from '../../application/usecases/create-faq/dtos/create-faq.dto';
import { EditFaqInputDto } from '../../application/usecases/edit-faq/dtos/edit-faq.dto';
import { FindAllFaqsQueryDto } from '../../application/usecases/find-all-faqs/dtos/find-all-faqs.dto';

@Injectable()
export class FaqDao {
  constructor(private prisma: PrismaService) {}

  public save(data: CreateFaqInputDto) {
    return this.prisma.faq.create({
      data,
    });
  }

  public findAll(queries: FindAllFaqsQueryDto) {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.FaqWhereInput = {
      AND: [
        {
          OR: [
            { question: { contains: queries.search } },
            { answer: { contains: queries.search } },
          ],
        },
      ],
    };

    return this.prisma.$transaction([
      this.prisma.faq.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.faq.count({ where }),
    ]);
  }

  public findById(id: string) {
    return this.prisma.faq.findUnique({
      where: { id },
    });
  }

  public edit(id: string, data: EditFaqInputDto) {
    return this.prisma.faq.update({
      where: { id },
      data,
    });
  }

  public delete(id: string) {
    return this.prisma.faq.delete({
      where: { id },
    });
  }
}
