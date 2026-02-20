/**
 * TESTES UNITÁRIOS — EditFaqInputDto (validação de entrada)
 *
 * Testes automatizados garantem que o código se comporta como esperado e
 * permitem detectar regressões rapidamente quando novas alterações são feitas.
 *
 * TIPO: Teste Unitário
 * Aqui testamos exclusivamente as regras de validação declaradas no DTO, sem
 * nenhuma dependência de banco de dados, serviços ou infraestrutura.
 *
 * DIFERENÇA PARA O CreateFaqInputDto
 * Este DTO é usado em operações de edição parcial (PATCH), ou seja, todos os
 * campos são opcionais. Um cliente pode enviar apenas `question`, apenas
 * `answer`, ambos ou nenhum. Os testes devem cobrir todos esses cenários para
 * garantir que o DTO não rejeita payloads parcialmente preenchidos.
 *
 * ESTRATÉGIA — ValidationPipe real (sem mock)
 * Usamos o `ValidationPipe` real do NestJS com as mesmas `pipeOptions` da
 * aplicação, garantindo que o pipe se comporta exatamente como em produção.
 *
 * PADRÃO makeValidInputDto
 * Como todos os campos são opcionais, o "DTO válido base" é um objeto vazio.
 * A função auxiliar aceita overrides para testar campos específicos de forma
 * isolada sem precisar repetir a estrutura base em cada teste.
 */
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditFaqInputDto } from './edit-faq.dto';

/**
 * `ArgumentMetadata` informa ao ValidationPipe que o dado sendo validado
 * veio do body da requisição e qual é o tipo esperado. Sem isso, o pipe
 * não saberia quais decorators de validação aplicar.
 */
const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditFaqInputDto,
};

/**
 * Fábrica de DTOs com suporte a overrides.
 * Como todos os campos são opcionais, o objeto base é vazio por padrão.
 * Cada teste sobrepõe apenas o campo que deseja testar.
 */
function makeValidInputDto(overrides: Partial<EditFaqInputDto> = {}): EditFaqInputDto {
  return {
    ...overrides,
  };
}

describe('EditFaqInputDto', () => {
  let target: ValidationPipe;

  // Recria o pipe a cada teste para garantir isolamento entre execuções.
  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('question field', () => {
    /**
     * `it.each` executa o mesmo teste para múltiplos valores inválidos,
     * evitando duplicação de código. O `expect.assertions(1)` garante que
     * o catch foi de fato executado — sem ele, um teste que não lança erro
     * passaria silenciosamente como falso positivo.
     */
    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if question is not a string (%s)', async(value: any) => {
      const data = makeValidInputDto({ question: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('question must be a string');
      });
    });

    // Teste de valor limite (boundary): 513 chars deve falhar; 512 deve passar (ver abaixo).
    it('should throw an error if question exceeds 512 characters', async() => {
      const data = makeValidInputDto({ question: 'a'.repeat(513) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('question must be shorter than or equal to 512 characters');
      });
    });

    it('should accept valid question', async() => {
      const data = makeValidInputDto({ question: 'Nova pergunta?' });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe('Nova pergunta?');
    });

    // Verifica que o decorator de trim remove espaços das bordas antes de persistir.
    it('should trim whitespace from question', async() => {
      const data = makeValidInputDto({ question: '  Nova pergunta?  ' });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe('Nova pergunta?');
    });

    /**
     * Verifica que o campo é opcional: enviar `undefined` não deve lançar erro.
     * Esse teste é crítico para garantir que o DTO suporta atualizações parciais
     * sem forçar o cliente a reenviar todos os campos.
     */
    it('should be optional', async() => {
      const data = makeValidInputDto({ question: undefined });

      const result = await target.transform(data, metadata);

      expect(result.question).toBeUndefined();
    });
  });

  describe('answer field', () => {
    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if answer is not a string (%s)', async(value: any) => {
      const data = makeValidInputDto({ answer: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('answer must be a string');
      });
    });

    // O limite de `answer` é maior (8192 chars) pois respostas podem ser mais longas.
    it('should throw an error if answer exceeds 8192 characters', async() => {
      const data = makeValidInputDto({ answer: 'a'.repeat(8193) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('answer must be shorter than or equal to 8192 characters');
      });
    });

    it('should accept valid answer', async() => {
      const data = makeValidInputDto({ answer: 'Nova resposta.' });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBe('Nova resposta.');
    });

    it('should trim whitespace from answer', async() => {
      const data = makeValidInputDto({ answer: '  Nova resposta.  ' });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBe('Nova resposta.');
    });

    it('should be optional', async() => {
      const data = makeValidInputDto({ answer: undefined });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBeUndefined();
    });
  });

  describe('all fields validation', () => {
    /**
     * Verifica que um payload completamente vazio é aceito.
     * Isso é fundamental para o caso de uso de PATCH: o cliente pode enviar
     * um objeto vazio sem que o DTO rejeite a requisição.
     * Também confirma que o pipe transforma o objeto em uma instância real da
     * classe `EditFaqInputDto` (importante para uso de `instanceof`).
     */
    it('should pass with empty object', async() => {
      const data = makeValidInputDto({});

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(EditFaqInputDto);
    });

    // Garante que enviar apenas `question` não gera erro por `answer` ausente.
    it('should pass with only question', async() => {
      const data = makeValidInputDto({ question: 'Nova pergunta?' });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe('Nova pergunta?');
      expect(result.answer).toBeUndefined();
    });

    // Garante que enviar apenas `answer` não gera erro por `question` ausente.
    it('should pass with only answer', async() => {
      const data = makeValidInputDto({ answer: 'Nova resposta.' });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBe('Nova resposta.');
      expect(result.question).toBeUndefined();
    });

    // Caminho feliz: todos os campos presentes e válidos.
    it('should pass with all fields', async() => {
      const data = makeValidInputDto({
        question: 'Pergunta atualizada?',
        answer: 'Resposta atualizada.',
      });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe('Pergunta atualizada?');
      expect(result.answer).toBe('Resposta atualizada.');
    });
  });
});
