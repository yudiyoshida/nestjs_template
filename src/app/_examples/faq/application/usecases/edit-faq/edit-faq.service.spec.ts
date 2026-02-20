/**
 * TESTES DE INTEGRAÇÃO — EditFaq (caso de uso)
 *
 * Testes automatizados garantem que o código se comporta como esperado e
 * permitem detectar regressões rapidamente quando novas alterações são feitas.
 *
 * TIPO: Teste de Integração
 * Aqui testamos o caso de uso `EditFaq` de ponta a ponta: desde a verificação
 * de existência do registro até a atualização real no banco de dados. Isso
 * garante que todas as peças (serviço, repositório, DAO e Prisma) funcionam
 * corretamente em conjunto.
 *
 * POR QUE NÃO USAR MOCKS AQUI?
 * Mockar o repositório ocultaria erros reais de integração, como uma query de
 * UPDATE que sobrescreve campos não enviados ou que não atualiza o registro
 * correto. Só o banco real consegue revelar esses problemas.
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
import { EditFaqInputDto } from './dtos/edit-faq.dto';
import { EditFaq } from './edit-faq.service';

describe('EditFaq - Integration tests', () => {
  // "sut" significa "System Under Test" — convenção que deixa claro qual
  // classe está sendo testada dentro do bloco de testes.
  let sut: EditFaq;
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

    sut = module.get(EditFaq);
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
   * Testa a regra de negócio central: tentar editar um FAQ inexistente deve
   * lançar `FaqNotFoundError`, não retornar silenciosamente nem lançar um erro
   * genérico do banco. Testar o tipo de erro garante que a camada de cima
   * (controller/filter) consiga tratá-lo corretamente e retornar o status
   * HTTP adequado ao cliente.
   */
  it('should throw FaqNotFoundError when faq does not exist', async() => {
    const id = 'non-existing-id';
    const data: EditFaqInputDto = { question: 'Nova pergunta' };

    await expect(sut.execute(id, data)).rejects.toThrow(FaqNotFoundError);
  });

  /**
   * Os três cenários de edição a seguir testam campos de forma independente
   * e combinada. Isso é importante para garantir que o UPDATE não sobrescreve
   * campos não enviados (patch parcial). Sem esses testes, uma implementação
   * incorreta que sempre atualizasse todos os campos passaria despercebida.
   * Verificamos o banco diretamente após a execução para confirmar a persistência.
   */
  it('should update faq question', async() => {
    const faq = await prisma.faq.create({
      data: { question: 'Pergunta original?', answer: 'Resposta original.' },
    });
    const data: EditFaqInputDto = { question: 'Pergunta atualizada?' };

    await sut.execute(faq.id, data);

    const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
    expect(updated?.question).toBe('Pergunta atualizada?');
    // Garante que o campo não enviado permaneceu inalterado.
    expect(updated?.answer).toBe('Resposta original.');
  });

  it('should update faq answer', async() => {
    const faq = await prisma.faq.create({
      data: { question: 'Pergunta?', answer: 'Resposta original.' },
    });
    const data: EditFaqInputDto = { answer: 'Resposta atualizada.' };

    await sut.execute(faq.id, data);

    const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
    // Garante que o campo não enviado permaneceu inalterado.
    expect(updated?.question).toBe('Pergunta?');
    expect(updated?.answer).toBe('Resposta atualizada.');
  });

  it('should update both question and answer', async() => {
    const faq = await prisma.faq.create({
      data: { question: 'P1?', answer: 'R1.' },
    });
    const data: EditFaqInputDto = {
      question: 'Pergunta nova?',
      answer: 'Resposta nova.',
    };

    await sut.execute(faq.id, data);

    const updated = await prisma.faq.findUnique({ where: { id: faq.id } });
    expect(updated?.question).toBe('Pergunta nova?');
    expect(updated?.answer).toBe('Resposta nova.');
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
    const data: EditFaqInputDto = { question: 'Nova?' };

    const result = await sut.execute(faq.id, data);

    expect(result).toEqual({ message: 'FAQ atualizado com sucesso' });
  });
});
