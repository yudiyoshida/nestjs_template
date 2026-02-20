/**
 * TESTES DE INTEGRAÇÃO — FindFaqById (caso de uso)
 *
 * Testes automatizados garantem que o código se comporta como esperado e
 * permitem detectar regressões rapidamente quando novas alterações são feitas.
 *
 * TIPO: Teste de Integração
 * Aqui testamos o caso de uso `FindFaqById` de ponta a ponta: desde a busca
 * pelo ID até o retorno dos dados formatados. Isso verifica que serviço, DAO
 * e Prisma funcionam corretamente em conjunto.
 *
 * POR QUE NÃO USAR MOCKS AQUI?
 * O propósito deste teste é garantir que a query de busca por ID funciona
 * corretamente com o banco real, incluindo o mapeamento dos campos retornados.
 * Mockar o DAO apenas verificaria que chamamos um método falso — sem nenhuma
 * garantia sobre o comportamento real da query.
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
import { FaqNotFoundError } from 'src/app/_examples/faq/domain/errors/faq-not-found.error';
import { FaqModule } from 'src/app/_examples/faq/faq.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FaqDto } from '../../dtos/faq.dto';
import { FindFaqById } from './find-faq-by-id.service';

describe('FindFaqById - Integration tests', () => {
  // "sut" significa "System Under Test" — convenção que deixa claro qual
  // classe está sendo testada dentro do bloco de testes.
  let sut: FindFaqById;
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

    sut = module.get(FindFaqById);
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

  /**
   * Testa a regra de negócio central: buscar um FAQ inexistente deve lançar
   * `FaqNotFoundError` com a mensagem correta, não retornar null nem lançar
   * um erro genérico do banco.
   *
   * Verificamos DOIS aspectos do erro:
   *   1. O tipo (`FaqNotFoundError`) — garante que o filter HTTP trata corretamente.
   *   2. A mensagem — garante que o texto exibido ao cliente não muda silenciosamente.
   */
  it('should throw FaqNotFoundError when faq does not exist', async() => {
    const id = 'non-existing-id';

    await expect(sut.execute(id)).rejects.toThrow(FaqNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('FAQ não encontrado na base de dados.');
  });

  it('should return faq by id', async() => {
    const faq = await prisma.faq.create({
      data: { question: 'Como recuperar senha?', answer: 'Clique em esqueci.' },
    });

    const result = await sut.execute(faq.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(faq.id);
    expect(result.question).toBe(faq.question);
    expect(result.answer).toBe(faq.answer);
  });

  /**
   * Verifica o contrato de mapeamento completo: garante que todos os campos
   * retornados pelo caso de uso batem exatamente com o que foi persistido.
   * O uso de `toEqual<FaqDto>` aproveita o TypeScript para garantir que
   * nenhum campo foi adicionado ou removido do DTO sem atualizar o teste.
   */
  it('should return all faq fields correctly', async() => {
    const faq = await prisma.faq.create({
      data: { question: 'Test?', answer: 'Test answer.' },
    });

    const result = await sut.execute(faq.id);

    expect(result).toEqual<FaqDto>({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    });
  });
});
