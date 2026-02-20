/**
 * TESTES DE INTEGRAÇÃO — DeleteFaq (caso de uso)
 *
 * Testes automatizados garantem que o código se comporta como esperado e
 * permitem detectar regressões rapidamente quando novas alterações são feitas.
 *
 * TIPO: Teste de Integração
 * Aqui testamos o caso de uso `DeleteFaq` de ponta a ponta: desde a verificação
 * de existência do registro até a remoção real no banco de dados. Isso garante
 * que todas as peças (serviço, repositório, DAO e Prisma) funcionam em conjunto.
 *
 * POR QUE NÃO USAR MOCKS AQUI?
 * O propósito deste teste é garantir que a lógica de negócio do caso de uso —
 * incluindo a verificação de existência e a deleção real — funciona corretamente.
 * Mockar o repositório ocultaria erros reais, como uma query de DELETE com
 * cláusula WHERE incorreta que nunca removesse o registro.
 *
 * POR QUE IMPORTAR O FaqModule INTEIRO?
 * O `FaqModule` registra todos os providers necessários para o caso de uso
 * funcionar, seguindo o mesmo grafo de dependências usado em produção. Isso
 * torna o teste fiel ao comportamento real da aplicação.
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
import { DeleteFaq } from './delete-faq.service';

describe('DeleteFaq - Integration tests', () => {
  // "sut" significa "System Under Test" — convenção que deixa claro qual
  // classe está sendo testada dentro do bloco de testes.
  let sut: DeleteFaq;
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

    sut = module.get(DeleteFaq);
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
   * Testa a regra de negócio central: tentar excluir um FAQ inexistente deve
   * lançar `FaqNotFoundError`, não retornar silenciosamente ou lançar um erro
   * genérico do banco. Testar o tipo de erro garante que a camada de cima
   * (controller/filter) consiga tratá-lo corretamente e retornar o status
   * HTTP adequado ao cliente.
   */
  it('should throw FaqNotFoundError when faq does not exist', async() => {
    const id = 'non-existing-id';

    await expect(sut.execute(id)).rejects.toThrow(FaqNotFoundError);
  });

  /**
   * Após chamar `sut.execute()`, verificamos diretamente no banco que o
   * registro foi removido. Verificar o banco (e não apenas confiar que
   * nenhuma exceção foi lançada) é essencial: o método poderia completar
   * sem erro mesmo que o DELETE não tivesse sido executado.
   */
  it('should delete faq from database', async() => {
    const faq = await prisma.faq.create({
      data: { question: 'Pergunta?', answer: 'Resposta.' },
    });

    await sut.execute(faq.id);

    const deleted = await prisma.faq.findUnique({ where: { id: faq.id } });
    expect(deleted).toBeNull();
  });

  /**
   * Verifica o contrato de saída do caso de uso: a mensagem de sucesso retornada
   * é consumida pelo controller e enviada ao cliente. Testar o conteúdo exato
   * garante que mudanças no texto não quebrem a resposta da API silenciosamente.
   */
  it('should return success message', async() => {
    const faq = await prisma.faq.create({
      data: { question: 'P?', answer: 'R.' },
    });

    const result = await sut.execute(faq.id);

    expect(result).toEqual({ message: 'FAQ excluído com sucesso' });
  });
});
