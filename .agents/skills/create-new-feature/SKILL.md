---
name: create-new-feature
description: Entrypoint de código novo no template. Use quando o usuário pedir para criar feature, módulo, CRUD, use case, decorator, DTO, entidade, factory, enum, controller, persistência, seed, cache, value object, erro, variável de ambiente, log, porta de vendor, ou invocar create-new-feature.
---

# Feature nova

Fecha o fato de produto com perguntas, confirma o escopo e só então lê as skills e escreve arquivo.

O texto enviado junto com o pedido é a primeira entrada. Extrair dela o que já está dito. Não tratar como spec fechada.

Esta skill não contém template de `src/`. O corpo de cada arquivo nasce da skill citada, na hora de escrever aquele arquivo.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir como entrevistar, o que perguntar ou qual skill nomear.** A entrevista, as listas de fatos, a prioridade do módulo e o roteador estão definidos aqui e apenas aqui.

Antes da confirmação explícita do recap, **não**:

- abra outra skill para aprender formato, árvore ou template
- leia `src/app/_examples`
- leia arquivo existente para copiar formato
- rode grep ou glob para inferir convenção
- escreva arquivo em `src/`

Se código existente contradiz a skill que for lida depois do sim, **aquela skill vence** na hora de escrever o arquivo dela.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada
- depois do sim, a skill nomeada no recap, e só ela naquele passo
- depois do sim, o arquivo de registro em que a skill manda inserir

## Regras

- Sem teto de rodadas. Parar de perguntar só quando a lista de fatos daquele artefato estiver toda respondida pelo usuário.
- Cada rodada pergunta só o que ainda bloqueia o artefato. Campos, rotas ou use cases da mesma camada vão na mesma rodada.
- Não reperguntar fato que o usuário já respondeu.
- "Você decide", "o padrão", "tanto faz" ou silêncio não fecham item. Perguntar de novo, nomeando o que falta.
- Não inventar coluna, rota, verbo, papel, filtro, enum, use case, comando extra ou comando interno.
- Lei de skill não é pergunta. Vem da skill na hora de gerar: delete físico, `PATCH` quando o body é parcial, `PUT` quando o body substitui o recurso, `findById` da porta devolve `null` e o use case HTTP lança not found, `Promise.all` na lista, pasta do módulo em kebab singular, URL em inglês no plural, enum `SCREAMING_SNAKE` com coluna Prisma `String`, uma tag Swagger, create devolve `{ id }`, update e delete devolvem `SuccessMessage`, `:id` usa `Params`, lista estende `Queries`. O que se pergunta é o fato que a lei consome.
- Proibido editar skill ou `.agents/plano-de-skills.md` durante a geração.
- Proibido copiar formato de arquivo vizinho. Em módulo que já existe, a leitura depois do sim serve só para inserir no registro que a skill indicar.

## Fluxo

```
Progresso:
- [ ] 1. Classificar o artefato com o que o usuário já disse
- [ ] 2. Rodadas até a lista de fatos daquele artefato fechar
- [ ] 3. Montar o recap, sem código
- [ ] 4. Esperar confirmação explícita
- [ ] 5. Ler só as skills nomeadas no recap
- [ ] 6. Gerar na ordem da skill e cumprir o checklist dela
```

1. Classificar o artefato com o que o usuário já disse. Se o artefato estiver ambíguo, a primeira pergunta é só isso.
2. Rodadas até a lista de fatos daquele artefato fechar.
3. Montar o recap. Sem código.
4. Esperar confirmação explícita. Correção reabre só os fatos alterados e volta ao passo 2.
5. Ler só as skills nomeadas no recap.
6. Gerar na ordem da skill. Cumprir o checklist dela antes de declarar a entrega pronta.

Confirmação que libera arquivo: "sim", "gera", "pode criar", "confirmado" ou "pode seguir", sem ressalva. Qualquer correção no meio não é confirmação.

O recap lista, nesta ordem:

- artefato e nome
- cada fato respondido
- skills que serão lidas, na ordem
- o que não será criado

## Quando usar

| Sintoma | Ação |
|---|---|
| Feature, módulo, CRUD ou peça nova, com formato ainda aberto | Seguir o fluxo. Nomear a skill no recap. Sem arquivo antes do sim |
| Formato de módulo já fechado pelos fatos | Nomear uma scaffold na prioridade abaixo |
| Peça única (use case, DTO, decorator, e as outras da tabela) | Nomear a skill dessa peça |

### Quando não usar

| Situação | Onde vai |
|---|---|
| Bug, refactor ou mudança de comportamento em código já entregue, sem peça nova | Fora (sem skill) |
| Formato de skill do repositório | Skill `creating-project-skills` |
| Pedido da lista "Fora de receita" | Parar. Sem arquivo |

## Fora de receita

Pedido inteiro sem skill: dizer que não há receita e parar. Sem arquivo.

Parte sem receita misturada com parte que tem skill: a parte sem receita entra no recap como "não será criada". Sem arquivo para ela. A parte com skill segue a entrevista.

Sem receita:

- Filas BullMQ
- JWT em cookie httpOnly
- Autorização CASL ou claims
- Auditoria por interceptor
- Sentry ou outro error tracking
- Teste e2e
- Gateway WebSocket
- Forgot ou reset password
- Segundo exception filter, pipe global novo ou interceptor novo
- `ValidatorConstraint` / `registerDecorator` de class-validator

## Prioridade do módulo

Dois sintomas no mesmo pedido: um caminho só.

1. Não é módulo (vendor, value object ou só falha de regra): skill pontual da tabela e pare.
2. Sem HTTP: `scaffolding-internal-module`. Invariante não troca este caminho para o rico.
3. HTTP e estado inválido não pode existir: `scaffolding-rich-module`.
4. HTTP e CRUD sem invariante: `scaffolding-anemic-module`.

HTTP ou invariante ainda desconhecido: perguntar. Sem recap e sem arquivo.

Não assumir CRUD completo. Admin, user e público levam só os verbos que o usuário nomear.

## Roteador

Nomear a skill no recap. Não abrir o arquivo antes do sim.

| Pedido | Skill |
|---|---|
| Módulo, CRUD ou regra, formato ainda não nomeado pela prioridade | `choosing-module-shape`, depois uma só scaffold |
| Módulo anêmico já nomeado | `scaffolding-anemic-module` |
| Módulo rico já nomeado | `scaffolding-rich-module` |
| Módulo interno já nomeado | `scaffolding-internal-module` |
| Entidade | `creating-domain-entity` |
| Factory | `creating-domain-factory` |
| Enum | `creating-domain-enum` |
| Use case | `creating-use-case` |
| DTO | `creating-application-dtos` |
| Porta de DAO ou repository | `creating-persistence-ports` |
| Módulo de persistência | `creating-persistence-module` |
| Model Prisma | `writing-prisma-model` |
| Adapter Prisma | `implementing-prisma-adapters` |
| Controller | `creating-controllers` |
| Decorator `Transform` compartilhado | `creating-class-validator-decorator` |
| Seed | `writing-prisma-seed` |
| Cache de uma leitura | `caching-a-read` |
| Collection Postman | `syncing-postman-collection` |
| Value object | `creating-value-objects` |
| Classe de erro | `creating-custom-errors` |
| Variável de ambiente | `using-core-config` |
| Log | `using-logger` |
| Redis, SMTP, S3 ou HTTP de terceiro | `using-ports-and-adapters` |
| Inventário de cenários do arquivo que vai ganhar spec | `inventorying-test-scenarios`, imediatamente antes da skill de spec |
| Spec unitário da entrega | `writing-unit-tests`, só a seção unitária do inventário |
| Spec de integração de use case ou adapter Prisma | `writing-integration-tests`, só a seção de integração do inventário |

Módulo inteiro cujo recap já nomeou uma scaffold: depois do sim, ler essa scaffold. Não ler `choosing-module-shape` de novo. Cada arquivo de produção abre a skill que a scaffold cita naquela linha. Spec não nasce no meio dessa tabela. No passo em que a scaffold manda spec, a ordem é `inventorying-test-scenarios` em cada arquivo alvo (use case e controller; entidade e factory no rico e no interno com agregado; DAO e repository na integração). Bug possível: parar e perguntar; não escrever spec desse arquivo. Sem bug pendente: `writing-unit-tests` implementa a seção unitária; `writing-integration-tests` implementa a de integração. Seção ausente no inventário: não chamar a skill daquela camada. DAO e repository não recebem `writing-unit-tests`. Não ler as outras skills de uma vez.

Peça única: ler a skill daquela peça até o arquivo de produção. O passo em que ela delega spec começa por `inventorying-test-scenarios` nesse arquivo. Mesma regra de bug e de seção. Nada além disso.

## Fatos

Fechado só quando cada item da lista tiver resposta do usuário.

### Módulo HTTP

- Nome do módulo.
- Cada coluna: nome, tipo e se é obrigatória.
- Se existe estado inválido que o objeto precise impedir.
- Admin: quais verbos. User logado: quais verbos. Público: quais verbos. "Nenhum" é resposta válida.
- Edição, se houver escrita de update: campos opcionais ou body que substitui o recurso inteiro.
- Filtro de lista além de `page`, `size` e `search`. "Nenhum" é resposta válida.
- Campo sensível (senha, token ou documento). "Nenhum" é resposta válida.

Rico, além da lista acima:

- Rótulos fechados e as transições. "Nenhuma transição" é resposta válida.
- Papel do user nas rotas logadas. Sem rota de user, o papel não entra.
- Se a mutação do user vale só para o dono.
- Comando extra e comando interno. "Nenhum" é resposta válida.

Anêmico com rótulo fechado: perguntar se estado inválido não pode existir (aí o caminho é rico) ou se o rótulo é só coluna, sem arquivo de enum. Não escolher no lugar do usuário.

### Módulo interno

- Nome do módulo.
- Módulo consumidor que fará o import.
- Use cases, cada um nomeado. Não completar com CRUD.
- Cada coluna: nome, tipo e se é obrigatória.
- Se há agregado (estado inválido não pode existir) ou persistência anêmica.
- Enum, value object e campo sensível só se o usuário nomear. Não oferecer por conta própria.

### Peça única

Use case, DTO, porta, adapter, controller, model Prisma, entidade, factory ou enum, fora de um módulo novo:

- Módulo de destino.
- Caso da tabela "Quando usar" da skill dessa peça: o usuário escolhe o caso, ou a resposta dele fecha o caso sem ambiguidade. Use case tem quatro casos: comando anêmico, comando rico, query, comando interno.
- Entrada e saída.
- Símbolo novo ou reuso de símbolo que ele diz que já existe.

### Decorator

- Transformação, em regra concreta.
- Dois DTOs ou mais que repetem essa transformação.

Um DTO só: não criar decorator. Dizer que a transformação fica nesse DTO e perguntar se o pedido passa a ser DTO (`creating-application-dtos`).

### Demais peças

- Value object: conceito, regra de formato e se vive em `src/shared` ou no módulo.
- Erro: falha, status HTTP, mensagem e se a classe é global ou do módulo.
- Env: nome, tipo e se é obrigatória.
- Log: fronteira. Entidade, value object, factory, controller ou happy path de use case não servem. Avisar e pedir adapter real ou filter.
- Vendor: Redis, SMTP, S3 ou HTTP de terceiro, e a operação.
- Seed: model e campos de cada registro. Senha, token ou outro segredo não entra no arquivo commitado. Se o registro precisa de segredo, perguntar de onde o valor vem na execução, sem gravar o valor.
- Cache: qual leitura. Sem leitura nomeada, não há escopo.
- Postman: caminho da entrada (`postman/swagger.json` ou `SWAGGER_PATH`). O usuário confirma que o JSON já está nesse caminho. Sem o JSON, não há escopo e não se inventa gerador.

## Depois do sim

Ler a skill. Escrever só o que ela manda, na ordem dela. Trocar o exemplo pelo nome e pelos fatos do recap.

Módulo ou peça que já existe: ler só o arquivo de registro em que a skill manda inserir (`*.module.ts`, `src/core/di/token.ts`, `AppModule` ou o módulo consumidor). O formato do arquivo novo sai da skill.

Não declarar a entrega pronta com item do checklist da skill ainda aberto.

## Checklist de entrega

Antes de declarar a geração pronta, confirmar **todos**:

- [ ] Recap confirmado pelo usuário antes do primeiro arquivo
- [ ] Nenhuma skill aberta antes dessa confirmação
- [ ] `src/app/_examples` não foi lido
- [ ] Só as skills nomeadas no recap foram lidas
- [ ] Checklist da skill que escreveu cada arquivo está fechado
