/**
 * TESTES DE INTEGRAÇÃO — CreateFaq (caso de uso)
 *
 * Testes automatizados garantem que o código se comporta como esperado e
 * permitem detectar regressões rapidamente quando novas alterações são feitas.
 *
 * TIPO: Teste de Integração
 * Aqui testamos o caso de uso `CreateFaq` de ponta a ponta: desde o recebimento
 * do input até a persistência no banco de dados. Isso verifica se todas as peças
 * (serviço, repositório, DAO e Prisma) funcionam corretamente em conjunto.
 *
 * POR QUE NÃO USAR MOCKS AQUI?
 * Ao contrário dos testes unitários do controller, o propósito deste teste é
 * garantir que a lógica de negócio do caso de uso — incluindo a chamada ao
 * repositório e a persistência real — funciona corretamente. Mockar o repositório
 * ocultaria erros de integração, como mapeamentos incorretos ou queries com falha.
 *
 * POR QUE IMPORTAR O FaqModule INTEIRO?
 * O `FaqModule` registra todos os providers necessários para o caso de uso
 * funcionar (repositório, DAO, PrismaService, etc.), seguindo o mesmo grafo de
 * dependências que será usado em produção. Isso torna o teste fiel ao
 * comportamento real da aplicação.
 *
 * BANCO DE DADOS DE TESTE
 * Estes testes devem ser executados contra um banco dedicado para testes
 * (configurado via variável de ambiente `DATABASE_URL`). Nunca execute testes
 * de integração contra o banco de produção.
 */
import { Test } from '@nestjs/testing';
import { FaqModule } from 'src/app/_examples/faq/faq.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateFaq } from './create-faq.service';
import { CreateFaqInputDto } from './dtos/create-faq.dto';

describe('CreateFaq - Integration tests', () => {
  // "sut" significa "System Under Test" — convenção que deixa claro qual
  // classe está sendo testada dentro do bloco de testes.
  let sut: CreateFaq;
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
      imports: [FaqModule],
    }).compile();

    sut = module.get(CreateFaq);
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
   * Verifica o contrato de saída do caso de uso: após executar com sucesso,
   * deve retornar um ID válido. Em seguida, confirmamos diretamente no banco
   * que o registro foi de fato persistido com os dados corretos.
   * Verificar no banco (e não apenas no retorno do método) garante que a
   * persistência ocorreu de verdade, e não apenas que o método não lançou erro.
   */
  it('should create faq and return id', async() => {
    const input: CreateFaqInputDto = {
      question: 'Como recuperar minha senha?',
      answer: 'Clique em "Esqueci minha senha" na tela de login.',
    };

    const result = await sut.execute(input);

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');

    const saved = await prisma.faq.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.question).toBe(input.question);
    expect(saved?.answer).toBe(input.answer);
  });

  /**
   * Complementa o teste anterior verificando campos gerados automaticamente
   * pelo banco (`createdAt`, `updatedAt`). O uso de `expect.objectContaining`
   * permite validar apenas os campos relevantes sem precisar conhecer o valor
   * exato dos timestamps, tornando o teste mais robusto a variações de tempo.
   */
  it('should persist faq in database', async() => {
    const input: CreateFaqInputDto = {
      question: 'Qual o horário de funcionamento?',
      answer: 'Segunda a sexta, das 8h às 18h.',
    };

    const { id } = await sut.execute(input);

    const faq = await prisma.faq.findUnique({ where: { id } });
    expect(faq).toEqual(
      expect.objectContaining({
        id,
        question: input.question,
        answer: input.answer,
      }),
    );
    expect(faq?.createdAt).toBeInstanceOf(Date);
    expect(faq?.updatedAt).toBeInstanceOf(Date);
  });
});
