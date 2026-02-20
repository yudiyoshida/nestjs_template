/**
 * TESTES DE INTEGRAÇÃO — FindAllFaq (caso de uso)
 *
 * Testes automatizados garantem que o código se comporta como esperado e
 * permitem detectar regressões rapidamente quando novas alterações são feitas.
 *
 * TIPO: Teste de Integração
 * Aqui testamos o caso de uso `FindAllFaq` de ponta a ponta: desde o recebimento
 * dos filtros/paginação até o retorno dos dados formatados pelo banco. Isso
 * garante que todas as peças (serviço, DAO e Prisma) funcionam em conjunto.
 *
 * POR QUE NÃO USAR MOCKS AQUI?
 * O propósito deste teste é verificar que a lógica de consulta (filtros,
 * paginação, ordenação e mapeamento) funciona corretamente com o banco real.
 * Mockar o DAO não revelaria erros como filtros OR incorretos, ordem errada
 * ou campos faltando no mapeamento da resposta.
 *
 * POR QUE IMPORTAR O FaqModule INTEIRO?
 * O `FaqModule` registra todos os providers necessários para o caso de uso
 * funcionar, seguindo o mesmo grafo de dependências usado em produção.
 *
 * BANCO DE DADOS DE TESTE
 * Estes testes devem ser executados contra um banco dedicado para testes
 * (configurado via variável de ambiente `DATABASE_URL`). Nunca execute testes
 * de integração contra o banco de produção.
 */
import { Test } from '@nestjs/testing';
import { FaqModule } from 'src/app/_examples/faq/faq.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FaqDto } from '../../dtos/faq.dto';
import { FindAllFaqQueryDto } from './dtos/find-all-faq.dto';
import { FindAllFaq } from './find-all-faq.service';

describe('FindAllFaq - Integration tests', () => {
  // "sut" significa "System Under Test" — convenção que deixa claro qual
  // classe está sendo testada dentro do bloco de testes.
  let sut: FindAllFaq;
  // Instância do Prisma exposta para que os testes possam preparar
  // e inspecionar o estado do banco diretamente (arrange/assert).
  let prisma: PrismaService;

  /**
   * beforeAll é executado UMA ÚNICA VEZ antes de todos os testes do bloco.
   * Usamos `beforeAll` (e não `beforeEach`) para criar a conexão com o banco
   * apenas uma vez, pois abrir e fechar conexões a cada teste seria lento.
   */
  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FaqModule],
    }).compile();

    sut = module.get(FindAllFaq);
    prisma = module.get(PrismaService);
  });

  /**
   * beforeEach limpa a tabela antes de cada teste para garantir isolamento:
   * cada teste começa com o banco vazio e cria exatamente os dados de que precisa.
   * Sem essa limpeza, registros de um teste poderiam contaminar os seguintes.
   */
  beforeEach(async() => {
    await prisma.faq.deleteMany();
  });

  /**
   * afterAll encerra a conexão com o banco após todos os testes.
   * Sem isso, o processo Node.js poderia ficar suspenso aguardando a conexão
   * ser fechada, impedindo que o Jest finalize corretamente.
   */
  afterAll(async() => {
    await prisma.$disconnect();
  });

  // Teste de sanidade: garante que o módulo foi configurado corretamente
  // e que o caso de uso foi instanciado sem erros de injeção de dependência.
  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  // Testa o comportamento padrão (estado vazio): garante que o caso de uso
  // retorna uma estrutura de paginação válida mesmo sem dados no banco.
  it('should return empty results when no faqs exist', async() => {
    const query: FindAllFaqQueryDto = {};

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  /**
   * Verifica que o caso de uso preenche corretamente todos os metadados da
   * resposta paginada (`totalItems`, `currentPage`, `itemsPerPage`, `totalPages`).
   * Esses campos são consumidos pelo frontend para construir a navegação de páginas.
   */
  it('should return all faqs with pagination', async() => {
    await prisma.faq.createMany({
      data: [
        { question: 'Pergunta 1?', answer: 'Resposta 1.' },
        { question: 'Pergunta 2?', answer: 'Resposta 2.' },
        { question: 'Pergunta 3?', answer: 'Resposta 3.' },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  /**
   * Teste de paginação: verifica que o caso de uso aplica corretamente `skip`
   * e `take` na query. Criamos 25 registros e consultamos páginas diferentes
   * para garantir que a última página retorna apenas os itens restantes (5 de 25)
   * e que `totalPages` é calculado corretamente (ceil(25/10) = 3).
   */
  it('should paginate results correctly', async() => {
    await prisma.faq.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        question: `Pergunta ${i + 1}?`,
        answer: `Resposta ${i + 1}.`,
      })),
    });

    const page1 = await sut.execute({ page: 1, size: 10 });
    const page3 = await sut.execute({ page: 3, size: 10 });

    expect(page1.data).toHaveLength(10);
    expect(page1.totalItems).toBe(25);
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(3);

    expect(page3.data).toHaveLength(5);
    expect(page3.currentPage).toBe(3);
  });

  /**
   * Verifica a ordenação por `createdAt desc` (mais recentes primeiro).
   * Os registros são criados em sequência sem delay pois o banco garante a
   * ordem de inserção para timestamps idênticos — mas validamos explicitamente
   * pelos IDs para tornar o teste determinístico e independente dessa garantia.
   */
  it('should order by createdAt desc', async() => {
    const first = await prisma.faq.create({
      data: { question: 'Primeira?', answer: 'Primeira.' },
    });
    const second = await prisma.faq.create({
      data: { question: 'Segunda?', answer: 'Segunda.' },
    });
    const third = await prisma.faq.create({
      data: { question: 'Terceira?', answer: 'Terceira.' },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0].id).toBe(third.id);
    expect(result.data[1].id).toBe(second.id);
    expect(result.data[2].id).toBe(first.id);
  });

  // Valida que o filtro de busca é aplicado sobre o campo `question`.
  // O uso de `.every()` na assertion garante que TODOS os itens retornados
  // contêm o termo buscado, não apenas o primeiro.
  it('should filter by search in question', async() => {
    await prisma.faq.createMany({
      data: [
        { question: 'Como recuperar senha?', answer: 'Clique em esqueci.' },
        { question: 'Qual horário?', answer: '8h às 18h.' },
        { question: 'Como alterar senha?', answer: 'No menu configurações.' },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, search: 'senha' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((f: FaqDto) => f.question.toLowerCase().includes('senha'))).toBe(true);
  });

  // Valida que o filtro de busca também é aplicado sobre o campo `answer`.
  it('should filter by search in answer', async() => {
    await prisma.faq.createMany({
      data: [
        { question: 'P1?', answer: 'Resposta sobre login.' },
        { question: 'P2?', answer: 'Resposta sobre cadastro.' },
        { question: 'P3?', answer: 'Outra resposta sobre login.' },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, search: 'login' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((f: FaqDto) => f.answer.toLowerCase().includes('login'))).toBe(true);
  });

  /**
   * Verifica o contrato de mapeamento: garante que todos os campos retornados
   * pelo caso de uso batem exatamente com o que foi persistido no banco.
   * O uso de `toEqual<FaqDto>` aproveita o TypeScript para garantir que
   * nenhum campo foi adicionado ou removido do DTO sem atualizar o teste.
   */
  it('should return correct FaqDto structure', async() => {
    const faq = await prisma.faq.create({
      data: { question: 'Test?', answer: 'Test answer.' },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0]).toEqual<FaqDto>({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    });
  });
});
