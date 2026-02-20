import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { TipPrismaAdapterDao } from '../../infra/driven/persistence/prisma/tip-prisma.dao';
import { TipPrismaAdapterRepository } from '../../infra/driven/persistence/prisma/tip-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.TipDao,
    useClass: TipPrismaAdapterDao,
  },
  {
    provide: TOKENS.TipRepository,
    useClass: TipPrismaAdapterRepository,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class TipPersistenceModule {}
