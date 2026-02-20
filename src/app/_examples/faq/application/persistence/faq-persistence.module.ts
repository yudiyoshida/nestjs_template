import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { FaqDaoAdapterPrisma } from '../../infra/driven/persistence/faq.dao';

/**
 * No Hexagonal, definimos "Adapters" que implementam "Ports" (Interfaces).
 * Aqui, estamos configurando como o NestJS deve resolver as dependências.
 */
const adapters: Provider[] = [
  {
    /**
     * VANTAGEM 1: Inversão de Dependência (DIP)
     * O 'TOKENS.FaqDao' representa o nosso "Port" (a interface).
     * O resto da aplicação não sabe que usamos Prisma; ela apenas pede o que estiver registrado nesse Token.
     */
    provide: TOKENS.FaqDao,

    /**
     * VANTAGEM 2: Substituibilidade
     * 'FaqDaoAdapterPrisma' é o nosso "Adapter".
     * Se amanhã decidirmos trocar Prisma por TypeORM ou MongoDB,
     * alteramos apenas esta linha, sem tocar na regra de negócio (Core).
     */
    useClass: FaqDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule], // Infraestrutura necessária para o Adapter funcionar
  providers: [...adapters],
  exports: [...adapters], // Exportamos o Token para que outros módulos usem o Port, não a classe concreta
})
export class FaqPersistenceModule {}
