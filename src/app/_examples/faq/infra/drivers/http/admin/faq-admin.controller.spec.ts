/**
 * TESTES UNITÁRIOS — FaqAdminController
 *
 * Testes automatizados garantem que o código se comporta como esperado e
 * permitem detectar regressões rapidamente quando novas alterações são feitas.
 *
 * TIPO: Teste Unitário
 * Testes unitários verificam uma única unidade de código (aqui, o controller)
 * em completo isolamento das suas dependências externas (banco de dados,
 * serviços reais, etc.). Isso torna a execução rápida e o diagnóstico de
 * falhas muito mais simples.
 *
 * POR QUE USAR MOCKS?
 * O controller depende de cinco serviços de aplicação (CreateFaq, FindAllFaq,
 * FindFaqById, EditFaq e DeleteFaq). Em um teste unitário não queremos que
 * essas dependências acessem o banco de dados real, pois isso tornaria o teste
 * lento, frágil e dependente de infraestrutura externa. Com mocks substituímos
 * cada dependência por uma versão controlada que retorna exatamente os dados
 * necessários para cada cenário de teste.
 *
 * A biblioteca `@golevelup/ts-jest` oferece `createMock<T>()`, que gera uma
 * implementação falsa respeitando o contrato TypeScript da interface/classe,
 * evitando que o mock fique desatualizado quando o tipo original muda.
 */
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FaqDto } from 'src/app/_examples/faq/application/dtos/faq.dto';
import { CreateFaq } from 'src/app/_examples/faq/application/usecases/create-faq/create-faq.service';
import { CreateFaqInputDto, CreateFaqOutputDto } from 'src/app/_examples/faq/application/usecases/create-faq/dtos/create-faq.dto';
import { DeleteFaq } from 'src/app/_examples/faq/application/usecases/delete-faq/delete-faq.service';
import { EditFaqInputDto } from 'src/app/_examples/faq/application/usecases/edit-faq/dtos/edit-faq.dto';
import { EditFaq } from 'src/app/_examples/faq/application/usecases/edit-faq/edit-faq.service';
import { FindAllFaqQueryDto } from 'src/app/_examples/faq/application/usecases/find-all-faq/dtos/find-all-faq.dto';
import { FindAllFaq } from 'src/app/_examples/faq/application/usecases/find-all-faq/find-all-faq.service';
import { FindFaqById } from 'src/app/_examples/faq/application/usecases/find-faq-by-id/find-faq-by-id.service';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { FaqAdminController } from './faq-admin.controller';

describe('FaqAdminController - Unit tests', () => {
  // "sut" significa "System Under Test" — convenção que deixa claro qual
  // classe está sendo testada dentro do bloco de testes.
  let sut: FaqAdminController;
  let createFaqService: CreateFaq;
  let findAllFaqService: FindAllFaq;
  let findFaqByIdService: FindFaqById;
  let editFaqService: EditFaq;
  let deleteFaqService: DeleteFaq;

  /**
   * beforeEach é executado antes de cada teste (`it`).
   * Aqui montamos um módulo NestJS mínimo contendo apenas o controller e os
   * mocks das dependências necessárias. Isso garante isolamento entre os testes:
   * nenhum estado compartilhado de uma execução anterior pode contaminar a próxima.
   *
   * ATENÇÃO — AuthenticationGuardsModule:
   * Diferente dos serviços de aplicação, o módulo de guards de autenticação é
   * importado de verdade (não como mock). Isso é necessário porque os guards são
   * configurados via decorators no controller e o NestJS precisa resolvê-los
   * durante a compilação do módulo de teste. Como os guards em si não fazem
   * chamadas externas (banco, rede) neste contexto, importar o módulo real não
   * introduz fragilidade ou lentidão ao teste.
   */
  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [FaqAdminController],
      providers: [
        /**
         * Cada serviço real é substituído por um mock usando o mesmo token de
         * injeção. O NestJS injeta o mock no controller de forma transparente,
         * sem que o controller precise saber que está recebendo uma versão falsa.
         */
        { provide: CreateFaq, useValue: createMock<CreateFaq>() },
        { provide: FindAllFaq, useValue: createMock<FindAllFaq>() },
        { provide: FindFaqById, useValue: createMock<FindFaqById>() },
        { provide: EditFaq, useValue: createMock<EditFaq>() },
        { provide: DeleteFaq, useValue: createMock<DeleteFaq>() },
      ],
    }).compile();

    sut = module.get(FaqAdminController);
    createFaqService = module.get(CreateFaq);
    findAllFaqService = module.get(FindAllFaq);
    findFaqByIdService = module.get(FindFaqById);
    editFaqService = module.get(EditFaq);
    deleteFaqService = module.get(DeleteFaq);
  });

  // Teste de sanidade: verifica se o módulo de teste foi configurado corretamente
  // e que o controller foi instanciado sem erros de injeção de dependência.
  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    /**
     * Verifica que o controller delega a criação ao serviço correto,
     * passando o body recebido sem modificações. A lógica de persistência
     * e validação de negócio é responsabilidade do serviço, não do controller.
     */
    it('should call createFaq.execute with body', async() => {
      const body = createMock<CreateFaqInputDto>();
      const output = createMock<CreateFaqOutputDto>();
      const createSpy = jest.spyOn(createFaqService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    /**
     * Verifica que o controller repassa os query params ao serviço de listagem
     * e retorna o resultado paginado sem transformações.
     */
    it('should call findAllFaq.execute with queries', async() => {
      const queries = createMock<FindAllFaqQueryDto>();
      const output = createMock<IPagination<FaqDto>>();
      const findAllSpy = jest.spyOn(findAllFaqService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    /**
     * Verifica que o controller extrai corretamente o `id` dos parâmetros de
     * rota e o passa ao serviço de busca por ID. Testar essa extração é
     * importante para evitar que o controller repasse o objeto `params` inteiro
     * ao invés de apenas o `params.id`.
     */
    it('should call findFaqById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<FaqDto>();
      const findOneSpy = jest.spyOn(findFaqByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      // Garante que apenas o ID foi enviado, não o objeto params completo.
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    /**
     * Verifica que o controller combina corretamente os dados de duas fontes:
     * o `id` vindo dos parâmetros de rota e o `body` vindo do payload da
     * requisição. Ambos precisam ser repassados juntos ao serviço de edição.
     */
    it('should call editFaq.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditFaqInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editFaqService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    /**
     * Verifica que o controller extrai o `id` dos parâmetros de rota e delega
     * a exclusão ao serviço correto, retornando a mensagem de sucesso.
     */
    it('should call deleteFaq.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteFaqService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
