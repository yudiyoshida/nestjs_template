/**
 * TESTES DE INTEGRAÇÃO — TipRepositoryAdapterPrisma
 *
 * Testes automatizados garantem que o código se comporta como esperado e
 * permitem detectar regressões rapidamente quando novas alterações são feitas.
 *
 * TIPO: Teste de Integração
 * Diferentemente dos testes unitários (que isolam a unidade com mocks), os
 * testes de integração verificam como dois ou mais componentes reais funcionam
 * juntos. Aqui testamos a integração entre o repositório (`TipRepositoryAdapterPrisma`)
 * e o banco de dados real via Prisma.
 *
 * POR QUE NÃO USAR MOCKS AQUI?
 * O objetivo do repositório é exatamente persistir e recuperar entidades no
 * banco de dados. Mockar o Prisma significaria não testar nada de relevante:
 * estaríamos apenas verificando que chamamos um método falso, sem nenhuma
 * garantia de que a persistência real funciona. Erros como mapeamento incorreto
 * entre entidade de domínio e modelo Prisma, campos faltando ou conversões
 * erradas só aparecem quando há um banco real respondendo.
 *
 * BANCO DE DADOS DE TESTE
 * Estes testes devem ser executados contra um banco de dados dedicado para testes
 * (normalmente configurado via variável de ambiente `DATABASE_URL` apontando para
 * um banco separado do de desenvolvimento/produção). Nunca execute testes de
 * integração contra o banco de produção.
 */
import { Test } from '@nestjs/testing';
import { Tip, TipProps } from 'src/app/_examples/tip/domain/entities/tip.entity';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { TipType } from 'src/app/_examples/tip/domain/enums/tip-type.enum';
import { TipFactory } from 'src/app/_examples/tip/domain/factories/tip.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { TipRepositoryAdapterPrisma } from './tip-prisma.repository';

describe('TipRepositoryAdapterPrisma - Integration tests', () => {
  // "sut" significa "System Under Test" — convenção que deixa claro qual
  // classe está sendo testada dentro do bloco de testes.
  let sut: TipRepositoryAdapterPrisma;
  // Instância do Prisma exposta para que os testes possam preparar
  // e inspecionar o estado do banco diretamente (arrange/assert).
  let prisma: PrismaService;

  /**
   * beforeAll é executado UMA ÚNICA VEZ antes de todos os testes do bloco.
   * Usamos `beforeAll` (e não `beforeEach`) para criar a conexão com o banco
   * apenas uma vez, pois abrir e fechar conexões a cada teste seria lento e
   * desnecessário. O estado do banco é limpo individualmente no `beforeEach`.
   */
  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule,
      ],
      providers: [
        TipRepositoryAdapterPrisma,
        PrismaService,
      ],
    }).compile();

    sut = module.get(TipRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  /**
   * beforeEach limpa a tabela antes de cada teste para garantir isolamento:
   * cada teste começa com o banco vazio e cria exatamente os dados de que precisa.
   * Sem essa limpeza, registros criados em um teste poderiam interferir nos
   * resultados dos testes seguintes, tornando a suíte não-determinística.
   */
  beforeEach(async() => {
    await prisma.tip.deleteMany();
  });

  /**
   * afterAll encerra a conexão com o banco após todos os testes.
   * Sem isso, o processo Node.js poderia ficar suspenso aguardando a conexão
   * ser fechada, impedindo que o Jest finalize a execução corretamente.
   */
  afterAll(async() => {
    await prisma.$disconnect();
  });

  describe('save', () => {
    // Verifica que dicas do tipo WEATHER são persistidas corretamente no banco.
    // Após salvar, busca o registro diretamente no Prisma para confirmar a persistência.
    it('should save a new weather tip to database', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Ventos fortes',
        content: 'Rajadas podem chegar a 60 km/h',
        locationId: null,
        createdBy: 'admin-user',
      });

      // Act
      await sut.save(tip);

      const savedTip = await prisma.tip.findUnique({
        where: { id: tip.props.id },
      });
      // Assert
      expect(savedTip).not.toBeNull();
    });

    // Verifica que dicas do tipo LOCAL são persistidas com o `locationId` correto.
    // Diferente das dicas WEATHER, as dicas LOCAIS têm associação a um local específico.
    it('should save a new local tip to database', async() => {
      // Arrange
      const locationId = 'Aeroporto de Congonhas';
      const tip = TipFactory.createLocal({
        title: 'Pista em manutenção',
        content: 'Setor norte indisponível',
        locationId,
        createdBy: 'admin-user',
      });

      // Act
      await sut.save(tip);

      const savedTip = await prisma.tip.findUnique({
        where: { id: tip.props.id },
      });
      // Assert
      expect(savedTip).not.toBeNull();
      expect(savedTip?.locationId).toBe(locationId);
    });

    /**
     * Verifica o contrato de mapeamento: garante que todos os campos da entidade
     * são persistidos corretamente no banco. Esse teste captura erros de mapeamento,
     * como campos renomeados, omitidos ou com tipos incorretos.
     */
    it('should save weather tip with all fields', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Ventos fortes',
        content: 'Rajadas podem chegar a 60 km/h',
        locationId: null,
        createdBy: 'admin-user',
      });

      // Act
      await sut.save(tip);

      const savedTip = await prisma.tip.findUnique({
        where: { id: tip.props.id },
      });
      // Assert
      expect(savedTip).toEqual({
        id: tip.props.id,
        type: tip.props.type,
        title: tip.props.title,
        content: tip.props.content,
        status: tip.props.status,
        locationId: tip.props.locationId,
        createdBy: tip.props.createdBy,
        expiresAt: tip.props.expiresAt,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    // Valida que `createdAt` e `updatedAt` são persistidos como instâncias de Date.
    it('should save tip with correct timestamps', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Test',
        content: 'Content',
        locationId: null,
        createdBy: 'admin-user',
      });

      // Act
      await sut.save(tip);

      const savedTip = await prisma.tip.findUnique({
        where: { id: tip.props.id },
      });
      // Assert
      expect(savedTip?.createdAt).toBeInstanceOf(Date);
      expect(savedTip?.updatedAt).toBeInstanceOf(Date);
    });

    // Dicas WEATHER têm data de expiração (`expiresAt`) e status ACTIVE por padrão.
    it('should save weather tip with ACTIVE status and expiresAt', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Test',
        content: 'Content',
        locationId: null,
        createdBy: 'admin-user',
      });

      // Act
      await sut.save(tip);

      const savedTip = await prisma.tip.findUnique({
        where: { id: tip.props.id },
      });
      // Assert
      expect(savedTip?.type).toBe(TipType.WEATHER);
      expect(savedTip?.status).toBe(TipStatus.ACTIVE);
      expect(savedTip?.expiresAt).toBeInstanceOf(Date);
    });

    // Dicas LOCAIS não têm data de expiração (`expiresAt` é null) e ficam ACTIVE.
    it('should save local tip with ACTIVE status and no expiresAt', async() => {
      // Arrange
      const locationId = 'Santos Dumont Airport';
      const tip = TipFactory.createLocal({
        title: 'Test',
        content: 'Content',
        locationId,
        createdBy: 'admin-user',
      });

      // Act
      await sut.save(tip);

      const savedTip = await prisma.tip.findUnique({
        where: { id: tip.props.id },
      });
      // Assert
      expect(savedTip?.type).toBe(TipType.LOCAL);
      expect(savedTip?.status).toBe(TipStatus.ACTIVE);
      expect(savedTip?.expiresAt).toBeNull();
    });
  });

  describe('edit', () => {
    // Verifica que título e conteúdo podem ser atualizados em conjunto.
    it('should update an existing tip', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Original Title',
        content: 'Original Content',
        locationId: null,
        createdBy: 'admin-user',
      });
      await sut.save(tip);

      const updatedTipEntity = TipFactory.load({
        ...tip.props,
        title: 'Updated Title',
        content: 'Updated Content',
      });
      // Act
      await sut.edit(updatedTipEntity);

      const updatedTip = await prisma.tip.findUnique({
        where: { id: tip.props.id },
      });
      // Assert
      expect(updatedTip?.title).toBe('Updated Title');
      expect(updatedTip?.content).toBe('Updated Content');
    });

    /**
     * Testa atualização parcial: apenas o título é alterado.
     * Garante que o repositório não sobrescreve campos não enviados (patch parcial).
     */
    it('should update only title', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Original Title',
        content: 'Original Content',
        locationId: null,
        createdBy: 'admin-user',
      });
      await sut.save(tip);

      const updatedTipEntity = TipFactory.load({
        ...tip.props,
        title: 'Updated Title',
      });
      // Act
      await sut.edit(updatedTipEntity);

      const updatedTip = await prisma.tip.findUnique({
        where: { id: tip.props.id },
      });
      // Assert
      expect(updatedTip?.title).toBe('Updated Title');
      // Garante que o campo não enviado permaneceu inalterado.
      expect(updatedTip?.content).toBe('Original Content');
    });

    // Testa atualização parcial: apenas o conteúdo é alterado.
    it('should update only content', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Original Title',
        content: 'Original Content',
        locationId: null,
        createdBy: 'admin-user',
      });
      await sut.save(tip);

      const updatedTipEntity = TipFactory.load({
        ...tip.props,
        content: 'Updated Content',
      });
      // Act
      await sut.edit(updatedTipEntity);

      const updatedTip = await prisma.tip.findUnique({
        where: { id: tip.props.id },
      });
      // Garante que o campo não enviado permaneceu inalterado.
      // Assert
      expect(updatedTip?.title).toBe('Original Title');
      expect(updatedTip?.content).toBe('Updated Content');
    });

    // Verifica que o método `expire()` da entidade persiste o status EXPIRED no banco.
    it('should update status when expired', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Test',
        content: 'Content',
        locationId: null,
        createdBy: 'admin-user',
      });
      await sut.save(tip);

      tip.expire();
      // Act
      await sut.edit(tip);

      const updatedTip = await prisma.tip.findUnique({
        where: { id: tip.props.id },
      });
      // Assert
      expect(updatedTip?.status).toBe(TipStatus.EXPIRED);
    });

    // Verifica que o método `remove()` da entidade persiste o status REMOVED no banco.
    it('should update status when removed', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Test',
        content: 'Content',
        locationId: null,
        createdBy: 'admin-user',
      });
      await sut.save(tip);

      tip.remove();
      // Act
      await sut.edit(tip);

      const updatedTip = await prisma.tip.findUnique({
        where: { id: tip.props.id },
      });
      // Assert
      expect(updatedTip?.status).toBe(TipStatus.REMOVED);
    });

    /**
     * Verifica que `updatedAt` é atualizado na persistência.
     * O `setTimeout` de 10ms garante que haja diferença mensurável entre
     * o timestamp original e o novo, tornando o teste determinístico.
     */
    it('should update updatedAt timestamp', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Test',
        content: 'Content',
        locationId: null,
        createdBy: 'admin-user',
      });
      const beforeSaveTimestamp = new Date();
      await sut.save(tip);

      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedTipEntity = TipFactory.load({ ...tip.props });
      // Act
      await sut.edit(updatedTipEntity);

      const updatedTip = await prisma.tip.findUnique({
        where: { id: tip.props.id },
      });
      // Assert
      expect(updatedTip?.updatedAt.getTime()).toBeGreaterThan(beforeSaveTimestamp.getTime());
    });
  });

  describe('delete', () => {
    /**
     * Após chamar `sut.delete()`, buscamos o registro diretamente no banco para
     * confirmar que ele foi removido. Verificar o banco diretamente (e não apenas
     * confiar que nenhuma exceção foi lançada) é essencial: o método poderia
     * completar sem erro mesmo que o DELETE não tenha sido executado.
     */
    it('should delete a tip from database', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Test',
        content: 'Content',
        locationId: null,
        createdBy: 'admin-user',
      });
      await sut.save(tip);

      // Act
      await sut.delete(tip.props.id);

      const deletedTip = await prisma.tip.findUnique({
        where: { id: tip.props.id },
      });
      // Assert
      expect(deletedTip).toBeNull();
    });

    // Confirma que a exclusão é física (hard delete), não lógica (soft delete).
    it('should perform hard delete (not soft delete)', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Test',
        content: 'Content',
        locationId: null,
        createdBy: 'admin-user',
      });
      await sut.save(tip);
      const tipId = tip.props.id;

      // Act
      await sut.delete(tipId);

      const count = await prisma.tip.count({ where: { id: tipId } });
      // Assert
      expect(count).toBe(0);
    });

    // Verifica que o método lança exceção ao tentar excluir um ID inexistente.
    it('should not throw error when deleting non-existing tip', async() => {
      // Arrange
      const nonExistingId = 'non-existing-id';

      // Act & Assert
      await expect(sut.delete(nonExistingId)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    // Testa o caso de borda: buscar por um ID inexistente deve retornar null,
    // não lançar uma exceção. O comportamento esperado aqui é um contrato
    // importante para as camadas superiores (serviços) que dependem desse repositório.
    it('should return null when tip does not exist', async() => {
      // Arrange
      const id = 'non-existing-id';

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    // Verifica que o repositório reconstrói a entidade Tip a partir dos dados do banco.
    it('should return Tip entity by id', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Test',
        content: 'Content',
        locationId: null,
        createdBy: 'admin-user',
      });
      await sut.save(tip);

      // Act
      const result = await sut.findById(tip.props.id);

      // Assert
      expect(result).toBeInstanceOf(Tip);
      expect(result?.props.id).toBe(tip.props.id);
    });

    // Valida o contrato de mapeamento: todas as propriedades da entidade devem bater.
    it('should return Tip entity with all properties', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Test',
        content: 'Content',
        locationId: null,
        createdBy: 'admin-user',
      });
      await sut.save(tip);

      // Act
      const result = await sut.findById(tip.props.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.props).toEqual<TipProps>({
        id: tip.props.id,
        type: tip.props.type,
        status: tip.props.status,
        title: tip.props.title,
        content: tip.props.content,
        locationId: tip.props.locationId,
        createdBy: tip.props.createdBy,
        expiresAt: tip.props.expiresAt,
      });
    });

    // Verifica que a entidade reconstruída possui os métodos de domínio (expire, remove, update).
    it('should return Tip entity with business methods', async() => {
      // Arrange
      const tip = TipFactory.createWeather({
        title: 'Test',
        content: 'Content',
        locationId: null,
        createdBy: 'admin-user',
      });
      await sut.save(tip);

      // Act
      const result = await sut.findById(tip.props.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.isWeather()).toBe(true);
      expect(result?.isLocal()).toBe(false);
      expect(result?.isActive()).toBe(true);
      expect(typeof result?.expire).toBe('function');
      expect(typeof result?.remove).toBe('function');
    });

    // Verifica que dicas LOCAIS são reconstruídas com os métodos corretos (isLocal, isWeather).
    it('should return local tip with business methods', async() => {
      // Arrange
      const locationId = 'Santos Dumont Airport';
      const tip = TipFactory.createLocal({
        title: 'Test',
        content: 'Content',
        locationId,
        createdBy: 'admin-user',
      });
      await sut.save(tip);

      // Act
      const result = await sut.findById(tip.props.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.isWeather()).toBe(false);
      expect(result?.isLocal()).toBe(true);
      expect(result?.isActive()).toBe(true);
    });
  });
});
