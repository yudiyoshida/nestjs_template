/**
 * TESTES DE INTEGRAÇÃO — FaqDaoAdapterPrisma
 *
 * Testes automatizados garantem que o código se comporta como esperado e
 * permitem detectar regressões rapidamente quando novas alterações são feitas.
 *
 * TIPO: Teste de Integração
 * Diferentemente dos testes unitários (que isolam a unidade com mocks), os
 * testes de integração verificam como dois ou mais componentes reais funcionam
 * juntos. Aqui testamos a integração entre o DAO (`FaqDaoAdapterPrisma`) e o
 * banco de dados real via Prisma.
 *
 * POR QUE NÃO USAR MOCKS AQUI?
 * O objetivo do DAO é exatamente executar queries no banco de dados. Mockar o
 * Prisma significaria não testar nada de relevante: estaríamos apenas verificando
 * que chamamos um método falso, sem nenhuma garantia de que a query real funciona.
 * Erros como filtros incorretos, ordenação errada, campos faltando no `select` ou
 * paginação quebrada só aparecem quando há um banco real respondendo.
 *
 * BANCO DE DADOS DE TESTE
 * Estes testes devem ser executados contra um banco de dados dedicado para testes
 * (normalmente configurado via variável de ambiente `DATABASE_URL` apontando para
 * um banco separado do de desenvolvimento/produção). Nunca execute testes de
 * integração contra o banco de produção.
 */
import { Test } from '@nestjs/testing';
import { FaqDto } from 'src/app/_examples/faq/application/dtos/faq.dto';
import { CreateFaqInputDto } from 'src/app/_examples/faq/application/usecases/create-faq/dtos/create-faq.dto';
import { EditFaqInputDto } from 'src/app/_examples/faq/application/usecases/edit-faq/dtos/edit-faq.dto';
import { FindAllFaqQueryDto } from 'src/app/_examples/faq/application/usecases/find-all-faq/dtos/find-all-faq.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FaqDaoAdapterPrisma } from './faq.dao';

describe('FaqDaoAdapterPrisma - Integration tests', () => {
  // "sut" significa "System Under Test" — convenção que deixa claro qual
  // classe está sendo testada dentro do bloco de testes.
  let sut: FaqDaoAdapterPrisma;
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
      imports: [ConfigModule],
      providers: [FaqDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(FaqDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  /**
   * beforeEach limpa a tabela antes de cada teste para garantir isolamento:
   * cada teste começa com o banco vazio e cria exatamente os dados de que precisa.
   * Sem essa limpeza, registros criados em um teste poderiam interferir nos
   * resultados dos testes seguintes, tornando a suíte não-determinística.
   */
  beforeEach(async() => {
    await prisma.faq.deleteMany();
  });

  /**
   * afterAll encerra a conexão com o banco após todos os testes.
   * Sem isso, o processo Node.js poderia ficar suspenso aguardando a conexão
   * ser fechada, impedindo que o Jest finalize a execução corretamente.
   */
  afterAll(async() => {
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    // Testa o comportamento padrão (estado vazio): importante para garantir
    // que o DAO trata corretamente o caso em que não há dados no banco.
    it('should return empty array when no faqs exist', async() => {
      const query: FindAllFaqQueryDto = {};

      const [faqs, total] = await sut.findAll(query);

      expect(faqs).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all faqs with default pagination', async() => {
      await prisma.faq.createMany({
        data: [
          { question: 'P1?', answer: 'R1.' },
          { question: 'P2?', answer: 'R2.' },
        ],
      });
      const query: FindAllFaqQueryDto = {};

      const [faqs, total] = await sut.findAll(query);

      expect(faqs).toHaveLength(2);
      expect(total).toBe(2);
    });

    /**
     * Teste de paginação: verifica que o DAO aplica `skip` e `take` corretamente
     * na query. Criamos 25 registros e consultamos páginas diferentes para
     * garantir que a última página retorna apenas os itens restantes (5 de 25).
     */
    it('should paginate results correctly', async() => {
      await prisma.faq.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          question: `P${i + 1}?`,
          answer: `R${i + 1}.`,
        })),
      });

      const [faqs, total] = await sut.findAll({ page: 1, size: 10 });
      expect(faqs).toHaveLength(10);
      expect(total).toBe(25);

      const [faqs2, total2] = await sut.findAll({ page: 3, size: 10 });
      expect(faqs2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    // Valida que o filtro de busca é aplicado sobre o campo `question`.
    it('should search in question field (case-insensitive)', async() => {
      await prisma.faq.createMany({
        data: [
          { question: 'Como recuperar senha?', answer: 'Clique em esqueci.' },
          { question: 'Qual horário?', answer: '8h às 18h.' },
        ],
      });
      const query: FindAllFaqQueryDto = { search: 'senha' };

      const [faqs, total] = await sut.findAll(query);

      expect(faqs).toHaveLength(1);
      expect(total).toBe(1);
      expect(faqs[0].question).toBe('Como recuperar senha?');
    });

    // Valida que o filtro de busca também é aplicado sobre o campo `answer`.
    it('should search in answer field (case-insensitive)', async() => {
      await prisma.faq.createMany({
        data: [
          { question: 'P1?', answer: 'Resposta sobre login.' },
          { question: 'P2?', answer: 'Resposta sobre cadastro.' },
        ],
      });
      const query: FindAllFaqQueryDto = { search: 'login' };

      const [faqs, total] = await sut.findAll(query);

      expect(faqs).toHaveLength(1);
      expect(total).toBe(1);
      expect(faqs[0].answer).toBe('Resposta sobre login.');
    });

    // Verifica que a busca usa OR entre os campos: um termo presente em qualquer
    // um dos dois campos (`question` ou `answer`) deve retornar o registro.
    it('should search in both question and answer', async() => {
      await prisma.faq.createMany({
        data: [
          { question: 'Pergunta sobre senha?', answer: 'Resposta.' },
          { question: 'Outra pergunta?', answer: 'Resposta sobre senha.' },
        ],
      });
      const query: FindAllFaqQueryDto = { search: 'senha' };

      const [faqs, total] = await sut.findAll(query);

      expect(faqs).toHaveLength(2);
      expect(total).toBe(2);
    });

    /**
     * Verifica a ordenação por `createdAt desc` (mais recentes primeiro).
     * O `setTimeout` de 10ms entre as criações garante que os registros
     * tenham timestamps diferentes, tornando a ordenação determinística.
     * Sem essa diferença de tempo, o banco poderia retornar os registros em
     * qualquer ordem, fazendo o teste falhar de forma intermitente.
     */
    it('should return results ordered by createdAt desc', async() => {
      const faq1 = await prisma.faq.create({
        data: { question: 'Primeira?', answer: 'Primeira.' },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const faq2 = await prisma.faq.create({
        data: { question: 'Segunda?', answer: 'Segunda.' },
      });
      const query: FindAllFaqQueryDto = {};

      const [faqs] = await sut.findAll(query);

      expect(faqs).toHaveLength(2);
      expect(faqs[0].id).toBe(faq2.id);
      expect(faqs[1].id).toBe(faq1.id);
    });

    /**
     * Verifica o contrato de mapeamento: garante que todos os campos retornados
     * pelo DAO batem exatamente com o que foi persistido no banco. Esse teste
     * captura erros de mapeamento, como campos renomeados ou omitidos.
     */
    it('should return all faq fields correctly', async() => {
      const created = await prisma.faq.create({
        data: { question: 'Test?', answer: 'Test answer.' },
      });
      const query: FindAllFaqQueryDto = {};

      const [faqs] = await sut.findAll(query);

      expect(faqs).toHaveLength(1);
      expect(faqs[0]).toEqual<FaqDto>({
        id: created.id,
        question: created.question,
        answer: created.answer,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    // Testa o caso de borda: buscar por um ID inexistente deve retornar null,
    // não lançar uma exceção. O comportamento esperado aqui é um contrato
    // importante para as camadas superiores (serviços) que dependem desse DAO.
    it('should return null when faq does not exist', async() => {
      const id = 'non-existing-id';

      const result = await sut.findById(id);

      expect(result).toBeNull();
    });

    it('should return faq by id', async() => {
      const created = await prisma.faq.create({
        data: { question: 'Test?', answer: 'Test answer.' },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.question).toBe('Test?');
      expect(result?.answer).toBe('Test answer.');
    });

    // Assim como em `findAll`, valida o contrato de mapeamento completo dos campos.
    it('should return all faq fields correctly', async() => {
      const created = await prisma.faq.create({
        data: { question: 'Test?', answer: 'Test answer.' },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result).toEqual<FaqDto>({
        id: created.id,
        question: created.question,
        answer: created.answer,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('save', () => {
    /**
     * Após chamar `sut.save()`, usamos o Prisma diretamente para buscar o
     * registro no banco e confirmar que ele foi de fato persistido com os
     * dados corretos. Essa verificação direta no banco (ao invés de confiar
     * apenas no retorno do método) é uma boa prática em testes de integração,
     * pois garante que a persistência ocorreu de verdade.
     */
    it('should create faq and return id', async() => {
      const data: CreateFaqInputDto = {
        question: 'Como recuperar senha?',
        answer: 'Clique em esqueci.',
      };

      const id = await sut.save(data);

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');

      const saved = await prisma.faq.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.question).toBe(data.question);
      expect(saved?.answer).toBe(data.answer);
    });
  });

  describe('edit', () => {
    /**
     * Os três cenários de edição testam campos de forma independente e combinada.
     * Isso é importante para garantir que a query de UPDATE não sobrescreve campos
     * que não foram enviados (patch parcial). Sem esses testes, uma implementação
     * incorreta que sempre atualiza todos os campos passaria despercebida se apenas
     * o caso de atualização completa fosse testado.
     */
    it('should update faq question', async() => {
      const faq = await prisma.faq.create({
        data: { question: 'Original?', answer: 'Original answer.' },
      });
      const data: EditFaqInputDto = { question: 'Updated?' };

      await sut.edit(faq.id, data);

      const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
      expect(updated?.question).toBe('Updated?');
      // Garante que o campo não enviado permaneceu inalterado.
      expect(updated?.answer).toBe('Original answer.');
    });

    it('should update faq answer', async() => {
      const faq = await prisma.faq.create({
        data: { question: 'Original?', answer: 'Original answer.' },
      });
      const data: EditFaqInputDto = { answer: 'Updated answer.' };

      await sut.edit(faq.id, data);

      const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
      // Garante que o campo não enviado permaneceu inalterado.
      expect(updated?.question).toBe('Original?');
      expect(updated?.answer).toBe('Updated answer.');
    });

    it('should update both question and answer', async() => {
      const faq = await prisma.faq.create({
        data: { question: 'P?', answer: 'R.' },
      });
      const data: EditFaqInputDto = {
        question: 'New question?',
        answer: 'New answer.',
      };

      await sut.edit(faq.id, data);

      const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
      expect(updated?.question).toBe('New question?');
      expect(updated?.answer).toBe('New answer.');
    });
  });

  describe('delete', () => {
    /**
     * Após chamar `sut.delete()`, buscamos o registro diretamente no banco para
     * confirmar que ele foi removido. Verificar o banco diretamente (e não apenas
     * confiar que nenhuma exceção foi lançada) é essencial: o método poderia
     * completar sem erro mesmo que o DELETE não tenha sido executado.
     */
    it('should delete faq from database', async() => {
      const faq = await prisma.faq.create({
        data: { question: 'P?', answer: 'R.' },
      });

      await sut.delete(faq.id);

      const deleted = await prisma.faq.findUnique({ where: { id: faq.id } });
      expect(deleted).toBeNull();
    });
  });
});
