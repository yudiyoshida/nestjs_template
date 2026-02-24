import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { TipDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/tip-prisma.dao';
import { TipRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/tip-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.TipDao,
    useClass: TipDaoAdapterPrisma,
  },
  {
    provide: TOKENS.TipRepository,
    useClass: TipRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class TipPersistenceModule {}
