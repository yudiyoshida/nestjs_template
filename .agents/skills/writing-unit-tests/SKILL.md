---
name: writing-unit-tests
description: Analisa um arquivo TypeScript e gera todos os cenários de teste possíveis (happy path, error path, edge cases) em um arquivo Jest *.spec.ts com describes aninhados e padrão AAA comentado. Use quando o usuário pedir para criar, gerar, escrever, completar ou revisar testes unitários de um arquivo, função, classe, service, use case, value object ou controller.
---

# Writing Unit Tests

Gera testes unitários Jest (`*.spec.ts`) para um arquivo TypeScript deste projeto,
cobrindo **todos** os cenários possíveis, com estrutura e formatação fixas.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos de teste do projeto para descobrir o padrão.**
Todo o padrão — estrutura de describes, nomes, AAA, comentários, formatação — está
definido aqui e apenas aqui.

Portanto, antes de escrever o arquivo de teste, **não**:

- leia, abra ou busque outros `*.spec.ts` / `*.test.ts`, nem os cite como referência
- rode grep/glob procurando `describe(`, `it(`, `it.each`, `sut` ou similares
- inspecione `jest.config`, `package.json`, helpers de teste ou factories/mocks
  compartilhados para inferir convenções
- copie estilo de testes existentes, mesmo que divirjam desta skill

Se um teste existente contradiz esta skill, **esta skill vence**. Nunca ajuste o
formato do arquivo novo para imitar um arquivo antigo.

Você só pode ler arquivos que não sejam de teste quando eles forem necessários
para entender o **comportamento** do código sob teste (ver passo 1). Ler para
entender comportamento: permitido. Ler para descobrir formatação: proibido.

Exceções: apenas quando o usuário pedir explicitamente para seguir um arquivo
específico como referência, ou pedir para editar/estender um `*.spec.ts` que já
existe — nesse caso leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Ler o arquivo alvo e suas dependências (tipos, erros, interfaces)
- [ ] 2. Listar os cenários por fonte de teste e por path
- [ ] 3. Escrever o arquivo <nome>.spec.ts seguindo a estrutura obrigatória
- [ ] 4. Rodar a suíte do arquivo e iterar até passar
- [ ] 5. Rodar o "Checklist de entrega" antes de responder
```

### 1. Ler o arquivo alvo

Leia o arquivo inteiro, mais o que ele importa e que afeta comportamento:
classes de erro, tipos/interfaces de entrada e saída, constantes de validação,
regex e dependências injetadas. Nada além disso — nenhum arquivo de teste.

### 2. Listar os cenários

Antes de escrever, enumere os cenários. Cada **fonte de teste** é uma função
exportada ou um método público da classe (inclui o `constructor` quando ele
valida ou transforma dados). Getters com lógica também contam.

Para cada fonte, varra o código e derive cenários de:

- cada `if` / `else` / ternário / `switch` / operador `??` e `||`
- cada `throw` e cada tipo de erro possível
- cada retorno distinto
- cada chamada a dependência: sucesso, falha (`rejects`), e verificação de que
  foi chamada com os argumentos corretos
- entradas inválidas: `null`, `undefined`, `''`, string só com espaços, tipo errado
- limites: mínimo, mínimo−1, máximo, máximo+1, zero, negativo, coleção vazia,
  coleção com um item
- normalizações: trim, case, remoção de máscara, arredondamento
- comportamento assíncrono: resolve, reject, timeout quando existir

Classifique cada cenário em um dos três paths e liste-os nesta ordem:

| Ordem | Path | Contém |
|-------|------|--------|
| 1 | `Happy path` | entradas válidas, fluxo esperado, retorno correto |
| 2 | `Error path` | erros lançados, rejeições, validações que falham |
| 3 | `Edge cases` | limites, valores vazios/nulos, normalizações, casos raros |

Omita um describe de path que não tenha nenhum cenário.

### 3. Estrutura obrigatória do arquivo

Regras, sem exceção:

1. Um **describe global** envolvendo todos os testes: `describe('<Nome> - Unit tests', ...)`.
2. Se o arquivo tiver **mais de uma fonte de teste** (2+ funções, ou classe com
   2+ métodos), cada fonte vira um describe com o nome da função/método, dentro
   do describe global.
3. Dentro de cada fonte, cada path vira um describe, **sempre nesta ordem**:
   `Happy path` → `Error path` → `Edge cases`. Nunca inverta nem intercale;
   um path sem cenários é omitido, e os restantes mantêm a ordem relativa.
4. Cada teste usa `it('should ...')`, descrevendo o comportamento esperado e a
   condição: `it('should throw InvalidCpfError when cpf has repeated digits')`.
5. Cada teste segue AAA: comentários `// Arrange`, `// Act`, `// Assert`, com uma
   **linha em branco separando cada bloco do próximo**. A linha em branco é
   separador, nunca terminador: o último bloco do teste (em geral `// Assert`)
   acaba na última linha de código, sem linha em branco depois.
6. Exceção única: quando act e assert acontecem na mesma expressão
   (ex.: `expect(() => ...).toThrow()`, `await expect(...).rejects`), use um
   único bloco `// Act & Assert`. O mesmo vale para `// Arrange & Act` quando o
   setup é a própria chamada.
7. Sem bloco `// Arrange` quando não há nada para preparar.
8. Setup repetido **sempre** vai para hook (`beforeEach`, `beforeAll`,
   `afterEach`, `afterAll`) — ver "Hooks" abaixo.
9. **Proibida linha em branco na abertura e no fechamento de qualquer bloco**
   (`describe`, `it`, hooks). A primeira linha de código vem imediatamente
   depois do `=> {`, e a última linha de código é imediatamente seguida do `});`.
   Linha em branco só existe **entre** blocos irmãos: uma entre dois `it`, uma
   entre dois `describe`, uma entre os blocos AAA.

Errado — sobrou linha em branco antes de cada `});`:

```ts
describe('Edge cases', () => {
  it('should return totalPages 0 when size is 0', () => {
    // Act
    const result = new Pagination([], 30, 1, 0).getDto();

    // Assert
    expect(result.totalPages).toBe(0);

  });

});
```

Certo:

```ts
describe('Edge cases', () => {
  it('should return totalPages 0 when size is 0', () => {
    // Act
    const result = new Pagination([], 30, 1, 0).getDto();

    // Assert
    expect(result.totalPages).toBe(0);
  });

  it('should return totalPages 0 when total is 0', () => {
    // Act
    const result = new Pagination([], 0, 1, 10).getDto();

    // Assert
    expect(result.totalPages).toBe(0);
  });
});
```

Arquivo com uma única fonte de teste (sem describe de função):

```ts
describe('CPF - Unit tests', () => {
  describe('Happy path', () => {
    it('should create a cpf value object when providing a valid cpf', () => {
      // Arrange
      const input = '820.670.530-94';

      // Act
      const sut = new CPF(input);

      // Assert
      expect(sut.value).toBe('82067053094');
    });
  });

  describe('Error path', () => {
    it('should throw InvalidCpfError when providing an invalid cpf', () => {
      // Act & Assert
      expect(() => new CPF('123.456.789-00')).toThrow(InvalidCpfError);
    });
  });
});
```

Arquivo com múltiplas fontes de teste:

```ts
describe('UserService - Unit tests', () => {
  let sut: UserService;
  let repository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    repository = { findById: jest.fn(), create: jest.fn() } as any;
    sut = new UserService(repository);
  });

  describe('findById', () => {
    describe('Happy path', () => {
      it('should return the user when the id exists', async () => {
        // Arrange
        repository.findById.mockResolvedValue(userMock);

        // Act
        const result = await sut.findById('1');

        // Assert
        expect(result).toEqual(userMock);
        expect(repository.findById).toHaveBeenCalledWith('1');
      });
    });

    describe('Error path', () => {
      it('should throw UserNotFoundError when the id does not exist', async () => {
        // Arrange
        repository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(sut.findById('1')).rejects.toThrow(UserNotFoundError);
      });
    });
  });

  describe('create', () => {
    describe('Happy path', () => {
      it('should create a user when providing valid data', async () => {
        // ...
      });
    });
  });
});
```

### Hooks

Nunca repita o mesmo setup em dois ou mais testes. Se uma linha de `// Arrange`
apareceria idêntica em 2+ testes, ela vira hook.

Qual hook usar:

| Hook | Usar para |
|------|-----------|
| `beforeEach` | instanciar o sut, criar mocks, `jest.useFakeTimers()`, stubs padrão — qualquer estado que precisa ser recriado por teste |
| `beforeAll` | setup caro e imutável: fixtures somente leitura, dados calculados uma vez |
| `afterEach` | limpeza: `jest.clearAllMocks()`, `jest.restoreAllMocks()`, `jest.useRealTimers()` |
| `afterAll` | encerrar recursos abertos no `beforeAll` |

Regras:

- Declare as variáveis compartilhadas com `let` no escopo do describe e atribua
  dentro do hook; nunca compartilhe objeto mutável via `const` no topo do arquivo.
- Coloque o hook no describe **mais interno** que precisa dele. Setup comum a
  todos vai no describe global; setup só do `Error path` vai no describe do
  `Error path`.
- Prefira `beforeEach` a `beforeAll` sempre que o estado for mutável — vazamento
  entre testes é pior que a duplicação evitada.
- Hooks não levam comentários AAA.
- Não mova para hook o valor que **define** o cenário do teste. A entrada e o
  resultado esperado de cada `it` ficam visíveis no próprio teste, mesmo que
  isso repita a forma; o hook carrega apenas o que é ruído comum.

```ts
describe('Error path', () => {
  beforeEach(() => {
    repository.findById.mockResolvedValue(null);
  });

  it('should throw UserNotFoundError when the id does not exist', async () => {
    // Act & Assert
    await expect(sut.findById('1')).rejects.toThrow(UserNotFoundError);
  });

  it('should not call the logger when the user does not exist', async () => {
    // Act
    await sut.findById('1').catch(() => undefined);

    // Assert
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
```

### 4. Rodar e iterar

```bash
npm test -- src/path/to/file.spec.ts
```

Se falhar: leia a mensagem, corrija o teste quando a expectativa estiver errada,
e **reporte ao usuário** quando a falha indicar um bug no código de produção — não
altere o código de produção para o teste passar sem confirmar. Repita até verde.

Antes de responder, percorra o "Checklist de entrega" no fim desta skill, item por item.

## Convenções deste projeto

Lista completa. Não verifique nem complemente estas convenções lendo outros
arquivos do projeto.

- Jest + `ts-jest`; arquivo de teste ao lado do arquivo alvo: `x.ts` → `x.spec.ts`
- Nome do describe global: `'<ClasseOuFuncao> - Unit tests'`
- Instância sob teste chamada `sut`
- Mensagens de erro em pt-BR; descrições dos testes em inglês (`should ...`)
- `it.each([...])('should ... (%s)', ...)` para muitos valores do mesmo cenário;
  o corpo mantém os comentários AAA normalmente. **Cada caso do array fica em
  sua própria linha**, um por linha, nunca vários casos na mesma linha:

```ts
it.each([
  null,
  undefined,
  '',
  '           ',
  'invalid-cpf',
  '123.456.789-00',
])('should throw InvalidCpfError when providing an invalid cpf (%s)', (cpf: any) => {
  // Act & Assert
  expect(() => new CPF(cpf)).toThrow(InvalidCpfError);
});
```

  Com múltiplos argumentos, cada caso é uma tupla em uma linha:

```ts
it.each([
  ['820.670.530-94', '82067053094'],
  ['82067053094', '82067053094'],
])('should normalize %s to %s', (input: string, expected: string) => {
  // Act
  const sut = new CPF(input);

  // Assert
  expect(sut.value).toBe(expected);
});
```
- Dependências sempre mockadas com `jest.fn()`; nada de I/O real, banco ou rede

## Checklist de entrega

Percorra **todos** os itens antes de responder ao usuário. Se algum falhar, corrija
o arquivo de teste e volte ao início do checklist.

### Cobertura (passo 2)

- [ ] Toda fonte de teste tem cenários: funções exportadas, métodos públicos,
      `constructor` que valida/transforma, getters com lógica
- [ ] Cada `if` / `else` / ternário / `switch` / `??` / `||` virou pelo menos um cenário
- [ ] Cada `throw` e tipo de erro possível está coberto
- [ ] Cada retorno distinto está coberto
- [ ] Dependências: sucesso, falha (`rejects`) e argumentos passados, quando aplicável
- [ ] Entradas inválidas (`null`, `undefined`, `''`, só espaços, tipo errado) cobertas
- [ ] Limites e normalizações cobertos quando existirem no código
- [ ] Comportamento assíncrono (resolve / reject) coberto quando existir

### Estrutura (regras 1 a 4)

- [ ] Um describe global: `'<Nome> - Unit tests'`
- [ ] Com 2+ fontes de teste, cada fonte tem seu próprio describe (nome da função/método)
- [ ] Paths na ordem `Happy path` → `Error path` → `Edge cases`; paths vazios omitidos
- [ ] Cada teste é `it('should ...')` com comportamento esperado e condição explícita

### Formatação (regras 5 a 9 e convenções)

- [ ] AAA com comentários `// Arrange`, `// Act`, `// Assert` e linha em branco **entre** blocos
- [ ] `// Act & Assert` (ou `// Arrange & Act`) quando act e assert são a mesma expressão
- [ ] Sem bloco `// Arrange` quando não há nada para preparar
- [ ] Nenhuma linha em branco logo após `=> {` nem logo antes de `});`
- [ ] Linha em branco apenas entre blocos irmãos (`it`, `describe`, blocos AAA)
- [ ] Instância sob teste chamada `sut`
- [ ] Descrições dos testes em inglês; mensagens de erro esperadas em pt-BR
- [ ] `it.each`: um caso por linha no array (valor simples ou tupla)
- [ ] Arquivo de teste ao lado do alvo: `x.ts` → `x.spec.ts`

### Hooks (seção Hooks)

- [ ] Setup idêntico em 2+ testes foi extraído para hook
- [ ] Hook no describe mais interno que precisa dele
- [ ] Variáveis compartilhadas com `let` no escopo do describe
- [ ] `afterEach` com limpeza quando há spy, mock ou fake timers
- [ ] Hooks sem comentários AAA
- [ ] Entrada e resultado esperado do cenário permanecem visíveis no `it`

### Processo (topo da skill e passo 4)

- [ ] Nenhum outro `*.spec.ts` / `*.test.ts` foi lido para inferir padrão ou formatação
- [ ] `npm test -- <arquivo>.spec.ts` passou
- [ ] Código de produção não foi alterado (ou bug reportado ao usuário)
- [ ] Resposta ao usuário informa quantos cenários por path e o que ficou descoberto de propósito
