---
name: inventorying-test-scenarios
description: Produz o inventário completo e sem redundância dos cenários de teste de um arquivo (happy path, erro e edge cases), cada um classificado como unitário ou de integração e detalhado para as skills de spec implementarem. Reporta bug possível e pergunta como seguir. Use quando o usuário pedir inventário de testes, cenários de QA, cobertura de um arquivo, ou imediatamente antes de writing-unit-tests e writing-integration-tests.
---

# Inventário de cenários

Dado um arquivo de código, produz o inventário completo e sem redundância dos cenários de teste (happy path, erro e edge cases) necessários para 100% de cobertura do arquivo. Cada cenário é classificado como unitário ou de integração e especificado com detalhe suficiente para as skills de spec implementarem sem adivinhar a intenção. Durante a análise, atua também como revisor: ao encontrar bug possível, reporta e pergunta ao usuário como seguir.

Não escreve `*.spec.ts` nem `*.integration.spec.ts`. Não altera código de produção.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o que entra no inventário, a partição unitário/integração ou o formato da resposta.** A varredura, a partição, a redundância, o bug e o template estão definidos aqui e apenas aqui.

Antes de responder, **não**:

- leia `*.spec.ts` ou `*.integration.spec.ts` para copiar cenário ou formato
- rode grep/glob para inferir convenção de teste
- abra outra skill para aprender quais cenários listar
- abra `src/app/_examples`

Se código existente contradiz esta skill, **esta skill vence** no inventário.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o arquivo que o usuário indicou, ou o arquivo de produção que vai ganhar spec
- o que esse arquivo importa e que muda comportamento: tipos, erros, interfaces, constantes, regex
- o `model` Prisma, só quando o arquivo é adapter Prisma ou o assert de integração precisa do nome real da coluna. Sem inventar coluna

Exceção: usuário apontar outro arquivo como entrada — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que a entrada é arquivo de produção, não spec
- [ ] 2. Ler o arquivo e o que muda o comportamento
- [ ] 3. Procurar bug possível. Achou: reportar e perguntar. Parar
- [ ] 4. Listar cada decisão e classificar em path e em camada, sem redundância
- [ ] 5. Escrever o inventário no template
- [ ] 6. Checklist de entrega
```

1. Spec (`*.spec.ts`, `*.integration.spec.ts`) não é entrada. Pedir o arquivo de produção.

2. Ler o arquivo inteiro e as dependências de comportamento. Nada de arquivo de teste.

3. Bug possível: parar. Sem inventário. Sem editar produção. A pergunta fica em aberto até o usuário responder.

4. Uma decisão vira um cenário, na camada dona, no path da tabela. Decisão já coberta por outro cenário do inventário não entra de novo.

5. Template desta skill. Valor literal em todo Arrange e Assert. Proibido "input válido", "erro adequado", "id qualquer".

6. Checklist antes de responder.

## Quando usar

| Sintoma | Ação |
|---------|------|
| Inventário, cenários de QA, cobertura de um arquivo | Fluxo neste arquivo |
| Skill de produção vai delegar spec | Este inventário primeiro, no arquivo de produção |
| Pedido nomeia esta skill | Fluxo |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Escrever `*.spec.ts` | Skill `writing-unit-tests`, com a seção unitária deste inventário |
| Escrever `*.integration.spec.ts` | Skill `writing-integration-tests`, com a seção de integração deste inventário |
| Teste HTTP ponta a ponta | Fora (sem skill) |
| Corrigir o bug encontrado | Fora. Esta skill pergunta; não edita produção |

## Lei

### O que é 100%

100% é cada decisão **deste** arquivo, não linha de import nem wiring do Nest.

Decisão:

- cada `if` / `else` / ternário / `switch` / `??` / `||` que muda retorno, throw ou argumento passado
- cada `throw` e cada tipo de erro
- cada retorno distinto
- cada chamada de dependência cujo resultado este arquivo usa (sucesso, `null`, `rejects`) e os argumentos que este arquivo escolhe
- entrada inválida, limite e normalização que **este** arquivo trata (`null`, `undefined`, `''`, só espaços, tipo errado, mínimo, máximo, vazio, um item, trim, case, máscara)

Não é decisão: getter que devolve campo sem lógica, `should be defined`, constraint do banco que o arquivo não consulta, branch interno de outra classe.

Fonte: função exportada, método público, `constructor` que valida ou transforma, getter com lógica. Método que o arquivo não tem não entra.

### Path

Ordem fixa. Path sem cenário é omitido.

| Ordem | Path | Contém |
|-------|------|--------|
| 1 | `Happy path` | entrada válida, fluxo esperado, retorno ou linha persistida correta |
| 2 | `Error path` | throw, reject, validação que falha |
| 3 | `Edge cases` | limite, vazio, `null`, normalização, caso raro que o código trata |

### Camada

Cada cenário tem uma camada só.

| Arquivo | Unitário | Integração |
|---------|----------|------------|
| DAO Prisma ou repository Prisma | nenhum | toda decisão do arquivo |
| VO, entidade, factory, enum, decorator, função pura, mapper, DTO, controller, guard, filter, interceptor | toda decisão | nenhum |
| Use case | toda decisão em memória: `if`, throw, argumentos da porta, retorno montado a partir do mock | só efeito que o mock não executa: linha gravada, lida, atualizada ou apagada no Postgres |
| Gateway de vendor | toda decisão com dependência substituível | nenhum |

Use case não repete na integração o throw que o unitário cobre com a porta devolvendo `null` ou `rejects`. Falha que só o banco produz (unique, FK) entra na integração só se este arquivo desvia nela. Não inventar cenário de constraint que o código não lê.

`search` e paginação ficam no arquivo que filtra ou pagina. Não copiar para o chamador.

Id inexistente, quando o cenário é de integração e a coluna `id` é UUID: `00000000-0000-0000-0000-000000000000`.

### Sem redundância

Mesmo fato observável (mesma entrada efetiva, mesmo efeito) é um cenário. Vários valores com o mesmo efeito e a mesma decisão viram um cenário `it.each`, valores listados um por linha.

Fato cujo único efeito já está no inventário de outro arquivo desta tarefa não é copiado. Este arquivo fica com a decisão que ele toma em cima do resultado.

Seção de camada sem cenário não aparece. Não criar spec dessa camada.

### Bug possível

Bug possível é comportamento que o próprio arquivo torna suspeito: condição invertida, branch inalcançável, `throw` engolido, `await` faltando, campo que o método diz persistir e não escreve, segredo selecionado sem o método ser o de leitura sensível, comparação que não pode ser verdadeira.

Não é bug possível: estilo, nome, ausência de teste, preferência.

Achou um ou mais:

- não escrever o inventário
- não editar produção
- não chamar skill de spec
- responder só com o bloco "Bugs possíveis" e a pergunta de como seguir

Usuário já respondeu nesta tarefa: não perguntar de novo. "Seguir o código" ou equivalente: inventariar o comportamento atual. "Corrigir": parar; a correção não é desta skill.

## Template

Resposta, não arquivo. Trocar os placeholders. Omitir path vazio e omitir a camada inteira se não houver cenário.

```markdown
# Inventário — `src/app/example/application/usecases/find-example-by-id/find-example-by-id.service.ts`

## Unitário — `find-example-by-id.service.spec.ts`

### execute

#### Happy path
- it: should return the dto when the dao finds the row
  - Arrange: `TOKENS.ExampleDao.findById` resolve `{ id: '<uuid>', name: 'Eletrônicos' }`
  - Act: `sut.execute('<uuid>')`
  - Assert: retorno igual ao dto; `findById` chamado com `'<uuid>'`
  - Cobre: retorno quando a porta devolve registro

#### Error path
- it: should throw ExampleNotFoundError when the dao returns null
  - Arrange: `findById` resolve `null`
  - Act: `sut.execute('00000000-0000-0000-0000-000000000000')`
  - Assert: rejeita `ExampleNotFoundError`; mensagem `Example não encontrado na base de dados.`
  - Cobre: `if (!row) throw`

## Integração — `find-example-by-id.service.integration.spec.ts`

### execute

#### Happy path
- it: should return the row stored in postgres
  - Arrange: `prisma.example.create({ data: { name: 'Eletrônicos' } })`
  - Act: `sut.execute(created.id)`
  - Assert: `result.id` igual a `created.id`; `result.name` igual a `'Eletrônicos'`
  - Cobre: leitura real pelo module, efeito que o mock não executa

## Fora do inventário
- integração "throw ExampleNotFoundError com a tabela vazia" — redundante com o unitário em que a porta devolve `null`
```

DAO: só a seção de integração. Controller, entidade, factory, VO: só a seção unitária.

Bloco de bug, no lugar do inventário:

```markdown
# Revisão — `src/app/example/.../edit-example.service.ts`

## Bugs possíveis
1. `execute`: o `if` lança `ExampleNotFoundError` quando a porta devolve o registro, e segue quando devolve `null`. A condição parece invertida. Como seguir?
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| `*.spec.ts` da seção unitária | Skill `writing-unit-tests` |
| `*.integration.spec.ts` da seção de integração | Skill `writing-integration-tests` |
| Código de produção | Não editar. Bug: perguntar |
| Teste HTTP ponta a ponta | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Entrada é arquivo de produção
- [ ] Bug possível: só o bloco de revisão, com pergunta, sem inventário e sem spec
- [ ] Sem bug: cada decisão do arquivo está no inventário ou em "Fora do inventário" com o motivo
- [ ] Nenhum fato repetido entre unitário e integração
- [ ] DAO e repository sem cenário unitário; controller, entidade, factory, VO, decorator e função pura sem cenário de integração
- [ ] Use case: throw com porta `null` ou `rejects` só no unitário; integração só com efeito no Postgres
- [ ] Paths na ordem `Happy path` → `Error path` → `Edge cases`; path vazio e camada vazia omitidos
- [ ] Cada cenário tem `it`, Arrange com literal, Act com a chamada, Assert com o valor ou a classe de erro, e a decisão que cobre
- [ ] Valores do mesmo efeito agrupados num `it.each`, um valor por linha
- [ ] Nenhum spec escrito e nenhum código de produção alterado
