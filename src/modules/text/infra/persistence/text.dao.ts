import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma.service';
import { EditTextInputDto } from '../../application/usecases/edit-text/dtos/edit-text.dto';

@Injectable()
export class TextDao {
  constructor(private prisma: PrismaService) {}

  public findByType(type: string) {
    return this.prisma.text.findUnique({
      where: { type },
    });
  }

  public edit(type: string, data: EditTextInputDto) {
    return this.prisma.text.upsert({
      where: { type },
      create: { type, ...data },
      update: data,
    });
  }
}
