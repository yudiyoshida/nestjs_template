/**
 * TESTES UNITÁRIOS — FaqUserController
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
 * O controller depende do serviço `FindAllFaq` para buscar dados. Em um teste
 * unitário não queremos que essa dependência acesse o banco de dados real, pois
 * isso tornaria o teste lento, frágil e dependente de infraestrutura externa.
 * Com mocks, substituímos a dependência por uma versão controlada que retorna
 * exatamente os dados que precisamos para cada cenário de teste.
 *
 * A biblioteca `@golevelup/ts-jest` oferece `createMock<T>()`, que cria uma
 * implementação falsa respeitando o contrato TypeScript da interface/classe,
 * evitando que o mock fique desatualizado quando o tipo original muda.
 */
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FaqDto } from 'src/app/_examples/faq/application/dtos/faq.dto';
import { FindAllFaqQueryDto } from 'src/app/_examples/faq/application/usecases/find-all-faq/dtos/find-all-faq.dto';
import { FindAllFaq } from 'src/app/_examples/faq/application/usecases/find-all-faq/find-all-faq.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { FaqUserController } from './faq-user.controller';

describe('FaqUserController - Unit tests', () => {
  // "sut" significa "System Under Test" — convenção que deixa claro qual
  // classe está sendo testada dentro do bloco de testes.
  let sut: FaqUserController;
  let findAllFaqService: FindAllFaq;

  /**
   * beforeEach é executado antes de cada teste (`it`).
   * Aqui montamos um módulo NestJS mínimo contendo apenas o controller e os
   * mocks das dependências necessárias. Isso garante isolamento entre os testes:
   * nenhum estado compartilhado de uma execução anterior pode contaminar a próxima.
   */
  beforeEach(async() => {
    const module = await Test.createTestingModule({
      controllers: [FaqUserController],
      providers: [
        /**
         * Substituímos o serviço real `FindAllFaq` por um mock.
         * O token de injeção (FindAllFaq) é mantido o mesmo para que o NestJS
         * injete o mock no lugar da implementação real sem alterar o controller.
         */
        { provide: FindAllFaq, useValue: createMock<FindAllFaq>() },
      ],
    }).compile();

    sut = module.get(FaqUserController);
    findAllFaqService = module.get(FindAllFaq);
  });

  // Teste de sanidade: verifica se o módulo de teste foi configurado corretamente
  // e que o controller foi instanciado sem erros de injeção de dependência.
  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    /**
     * Cenário 1: verificar o COMPORTAMENTO do controller.
     * O objetivo aqui não é testar a lógica de negócio (isso é responsabilidade
     * do serviço), mas sim garantir que o controller:
     *   1. Chama o serviço correto (`FindAllFaq.execute`).
     *   2. Passa exatamente os parâmetros recebidos sem modificá-los.
     *   3. Retorna o resultado do serviço sem transformações indevidas.
     *
     * `jest.spyOn(...).mockResolvedValue(output)` intercepta a chamada ao método
     * `execute` do mock e força o retorno de `output`, permitindo controlar
     * o cenário sem depender do banco de dados.
     */
    it('should call findAllFaq.execute with queries', async() => {
      const queries = createMock<FindAllFaqQueryDto>();
      const output = createMock<IPagination<FaqDto>>();
      const findAllSpy = jest.spyOn(findAllFaqService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      // Garante que o controller delegou a chamada com os parâmetros corretos.
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });

    /**
     * Cenário 2: verificar o FORMATO da resposta paginada.
     * Aqui definimos um `output` concreto (ao invés de usar createMock) para
     * conseguir fazer asserções precisas sobre os campos individuais do retorno.
     * Isso é útil para documentar o contrato de resposta esperado pelo cliente.
     */
    it('should return paginated result', async() => {
      const queries = createMock<FindAllFaqQueryDto>({ page: 1, size: 10 });
      const output: IPagination<FaqDto> = {
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        itemsPerPage: 10,
      };
      jest.spyOn(findAllFaqService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(result.data).toEqual([]);
      expect(result.totalItems).toBe(0);
    });
  });
});
