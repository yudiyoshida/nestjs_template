/**
 * TESTES UNITÁRIOS — CreateFaqInputDto (validação de entrada)
 *
 * Testes automatizados garantem que o código se comporta como esperado e
 * permitem detectar regressões rapidamente quando novas alterações são feitas.
 *
 * TIPO: Teste Unitário
 * Aqui testamos exclusivamente as regras de validação declaradas no DTO, sem
 * nenhuma dependência de banco de dados, serviços ou infraestrutura. O DTO é
 * a primeira linha de defesa contra dados inválidos vindos do cliente.
 *
 * POR QUE TESTAR O DTO SEPARADAMENTE?
 * As validações do DTO (obrigatoriedade, tipo, tamanho máximo, trim, etc.) são
 * contratos públicos da API. Testá-las de forma isolada garante que:
 *   1. Mensagens de erro retornadas ao cliente estão corretas.
 *   2. Transformações automáticas (como trim) funcionam como esperado.
 *   3. Mudanças nos decorators não quebrem o contrato silenciosamente.
 *
 * ESTRATÉGIA — ValidationPipe real (sem mock)
 * Usamos o `ValidationPipe` real do NestJS com as mesmas `pipeOptions` da
 * aplicação. Isso garante que o pipe se comporta exatamente como em produção,
 * incluindo a transformação do objeto bruto em uma instância da classe DTO.
 * Não há necessidade de mocks aqui, pois não há dependências externas.
 *
 * PADRÃO makeValidInputDto
 * A função auxiliar `makeValidInputDto` cria um DTO válido por padrão e
 * aceita overrides para campos específicos. Esse padrão evita repetição e
 * torna cada teste focado apenas na variação que está sendo testada.
 */
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateFaqInputDto } from './create-faq.dto';

/**
 * `ArgumentMetadata` informa ao ValidationPipe que o dado sendo validado
 * veio do body da requisição e qual é o tipo esperado. Sem isso, o pipe
 * não saberia quais decorators de validação aplicar.
 */
const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateFaqInputDto,
};

/**
 * Fábrica de DTOs válidos com suporte a overrides.
 * Centraliza a criação do objeto base para que cada teste precise declarar
 * apenas o campo que deseja testar em condição inválida ou especial.
 */
function makeValidInputDto(overrides: Partial<CreateFaqInputDto> = {}): CreateFaqInputDto {
  return {
    question: 'Como faço para recuperar minha senha?',
    answer: 'Clique em "Esqueci minha senha" na tela de login.',
    ...overrides,
  };
}

describe('CreateFaqInputDto', () => {
  let target: ValidationPipe;

  // Recria o pipe a cada teste para garantir que não haja estado acumulado
  // entre execuções (o ValidationPipe é stateless, mas a recriação é uma
  // boa prática para clareza e consistência com o padrão beforeEach).
  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('question field', () => {
    /**
     * `it.each` executa o mesmo teste para múltiplos valores, evitando
     * duplicação de código. Aqui cobrimos todos os casos de "vazio":
     * undefined (campo ausente), null, string vazia e string só com espaços.
     * O `expect.assertions(1)` garante que o catch foi executado — sem ele,
     * um teste que não lança erro passaria silenciosamente.
     */
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if question is empty (%s)', async(value: any) => {
      const data = makeValidInputDto({ question: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('question should not be empty');
      });
    });

    // Testa que o campo rejeita tipos primitivos e estruturados que não sejam string.
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

    // Verifica que o decorator `@Transform` (ou `@IsString` com trim) remove
    // espaços das bordas antes de persistir. Sem esse teste, um bug no
    // decorator de trim passaria despercebido.
    it('should trim whitespace from question', async() => {
      const data = makeValidInputDto({ question: '  Valid question?  ' });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe('Valid question?');
    });

    it('should accept valid question', async() => {
      const data = makeValidInputDto({ question: 'Como recuperar senha?' });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe('Como recuperar senha?');
    });
  });

  describe('answer field', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if answer is empty (%s)', async(value: any) => {
      const data = makeValidInputDto({ answer: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('answer should not be empty');
      });
    });

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

    // O limite de `answer` é maior (8192 chars) pois respostas de FAQ
    // podem ser mais longas que perguntas.
    it('should throw an error if answer exceeds 8192 characters', async() => {
      const data = makeValidInputDto({ answer: 'a'.repeat(8193) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('answer must be shorter than or equal to 8192 characters');
      });
    });

    it('should trim whitespace from answer', async() => {
      const data = makeValidInputDto({ answer: '  Valid answer.  ' });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBe('Valid answer.');
    });

    it('should accept valid answer', async() => {
      const data = makeValidInputDto({ answer: 'Clique em esqueci senha.' });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBe('Clique em esqueci senha.');
    });
  });

  describe('all fields validation', () => {
    /**
     * Teste de caminho feliz com todos os campos válidos.
     * Verifica também que o pipe transforma o objeto bruto em uma instância
     * real da classe `CreateFaqInputDto` (importante para que outras partes
     * do sistema possam usar `instanceof` de forma confiável).
     */
    it('should pass if all fields are valid', async() => {
      const data = makeValidInputDto({
        question: 'Como faço para recuperar minha senha?',
        answer: 'Clique em "Esqueci minha senha" na tela de login.',
      });

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(CreateFaqInputDto);
      expect(result.question).toBe('Como faço para recuperar minha senha?');
      expect(result.answer).toBe('Clique em "Esqueci minha senha" na tela de login.');
    });

    /**
     * Testes de valor limite (boundary value analysis): verificam exatamente
     * o valor máximo permitido (512 e 8192 chars). Esses testes são importantes
     * porque erros de "menor que" vs "menor ou igual a" na configuração do
     * decorator causariam rejeição de valores que deveriam ser aceitos.
     */
    it('should accept boundary values for question (512 chars)', async() => {
      const question = 'a'.repeat(512);
      const data = makeValidInputDto({ question });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe(question);
    });

    it('should accept boundary values for answer (8192 chars)', async() => {
      const answer = 'a'.repeat(8192);
      const data = makeValidInputDto({ answer });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBe(answer);
    });
  });
});
