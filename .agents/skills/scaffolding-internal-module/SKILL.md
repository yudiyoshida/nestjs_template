---
name: scaffolding-internal-module
description: Gera o módulo interno sem HTTP, fora do AppModule, com providers e exports iguais aos use cases, delegando cada arquivo à skill pontual. Use quando o usuário pedir para criar módulo interno, módulo sem controller, módulo só consumido por outro, módulo no estilo Account, ou scaffolding-internal-module.
---

# Scaffold de módulo interno

Gera o módulo sem HTTP que outro módulo consome, na árvore canônica, delegando cada arquivo à skill pontual.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de módulo interno.** Todo o padrão — árvore, ordem, leis, contratos passados a cada skill, módulo Nest e import no consumidor — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia arquivos existentes para copiar formato
- rode grep/glob para inferir convenção
- abra `src/app/account`, `src/app/authentication` nem skill vizinha para aprender seção, algoritmo ou template
- copie template de DTO, porta, adapter, use case, enum, value object, entidade ou factory

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada (nome do módulo, colunas, use cases e o módulo consumidor)
- arquivo que exporta `<Consumidor>Module` — só para inserir o import (seção "Bloco base")

A skill pontual citada em "Delegar a" é quem escreve o arquivo dela. Esta skill não reproduz o corpo desse arquivo. Abrir a skill pontual na hora de escrever aquele arquivo é executar a delegação, não aprender o formato desta orquestração.

Exceção: usuário apontar um arquivo, ou pedir edição de um arquivo que já existe — leia só esse arquivo.

### Leis

- Sem controller. Sem rota, sem `Swagger`, sem `RequiredRoles`, sem `Params`.
- Fora de `AppModule`. O consumidor importa `XxxModule` e recebe os use cases pelo export.
- `providers` e `exports` são o mesmo array de use cases. Proibido exportar `XxxPersistenceModule` ou token.
- Sem `AuthenticationGuardsModule`.
- Persistência anêmica quando não há agregado: só `IXxxDao` e `XxxDaoAdapterPrisma` em `src/app/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.dao.ts`. Sem entidade, sem factory, sem repository.
- Há agregado (estado inválido não pode existir): entidade, factory, os enums que o pedido nomear, DAO só leitura e repository. Continua sem controller e fora do `AppModule`.
- Use case deste módulo não lança `NotFound` por registro ausente. Devolve `null` ou ignora o registro. Quem tem HTTP é o consumidor.
- Enum só se o pedido nomear. Valor explícito `SCREAMING_SNAKE`. Coluna no Prisma é `String`. Proibido valor `'Ativo'` ou `'Active'`.
- Value object só se o conceito for do módulo. Pasta `domain/value-objects/`.
- Segredo (senha, token, documento): select padrão sem o segredo. Leitura sensível tem método próprio e DTO `WithSensitiveData`. Só quando o pedido tiver segredo.
- Classe do adapter: `XxxDaoAdapterPrisma`. Com agregado, também `XxxRepositoryAdapterPrisma`.
- Import absoluto `src/...`. Proibido import relativo no `<modulo>.module.ts` e no import que esta skill acrescenta ao consumidor.
- Classe do use case sem sufixo `Service`. Arquivo `<acao>.service.ts`. Método público `execute`.
- Pasta do módulo em kebab, singular.
- Colunas, métodos do DAO e use cases vêm do pedido. Proibido inventar busca por credencial, esqueci senha ou troca de senha.
- O consumidor é o que o pedido nomear. Pedido sem consumidor: parar e pedir o nome. Proibido assumir um consumidor.
- Esta skill não cria o módulo consumidor.

### Árvore

Sem agregado:

```
src/app/<modulo>/
  <modulo>.module.ts
  domain/enums/<nome>.enum.ts
  domain/value-objects/
  application/dtos/<modulo>.dto.ts
  application/persistence/<modulo>-persistence.module.ts
  application/persistence/dao/<modulo>-dao.interface.ts
  application/usecases/<verbo>-<modulo>/
    <verbo>-<modulo>.service.ts
  infra/driven/persistence/prisma/<modulo>-prisma.dao.ts
prisma/schema/<modulo>.prisma
```

Com agregado, a árvore ganha `domain/entities/<modulo>.entity.ts`, `domain/factories/<modulo>.factory.ts`, `domain/errors/` quando a invariante precisar de erro, `application/persistence/repository/<modulo>-repository.interface.ts` e `infra/driven/persistence/prisma/<modulo>-prisma.repository.ts`.

Enum, value object, DTO `WithSensitiveData` e pasta de use case só entram quando o pedido os nomear. Também entra a chave `XxxDao` em `src/core/di/token.ts`. Com agregado, entra também `XxxRepository`.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar o caso interno e o consumidor
- [ ] 2. Fixar pasta, classes e a lista de use cases
- [ ] 3. Delegar os arquivos na ordem da tabela
- [ ] 4. Escrever <modulo>.module.ts pelo template
- [ ] 5. Inserir XxxModule no consumidor
- [ ] 6. Inventariar cenários e delegar os specs
- [ ] 7. Checklist de entrega
```

1. Confirmar módulo sem HTTP, consumido por outro. O pedido traz controller ou URL: parar e nomear `scaffolding-anemic-module` (CRUD sem invariante) ou `scaffolding-rich-module` (estado inválido não pode existir, com HTTP). Não criar arquivo. O pedido não nomeia o consumidor: parar e pedir o nome. Não criar arquivo.

2. Fixar a pasta kebab singular, o PascalCase `Xxx` e a lista de use cases do pedido. Decidir: sem agregado (persistência anêmica) ou com agregado.

3. Delegar na ordem abaixo. Pular a linha que o caso não pede. Não escrever o corpo do arquivo nesta skill.

| Ordem | Arquivo | Delegar a | Contrato a passar |
|---|---|---|---|
| 1 | `domain/enums/<nome>.enum.ts`, um arquivo por enum que o pedido nomear | `creating-domain-enum` | Valor `SCREAMING_SNAKE`. Sem enum, pular |
| 2 | `domain/value-objects/`, um VO por conceito do módulo | `creating-value-objects` | Só se o pedido nomear o conceito. Sem VO, pular |
| 3 | entidade, factory e erro de invariante | `creating-domain-entity`, `creating-domain-factory`, `creating-custom-errors` | Só com agregado. Delete físico não vira método da entidade. Falha de validação é classe de erro |
| 4 | `prisma/schema/<modulo>.prisma` | `writing-prisma-model` | Colunas do pedido. Enum de domínio como `String` |
| 5 | `application/dtos/<modulo>.dto.ts` | `creating-application-dtos` | Read model plano. Com segredo, o DTO padrão omite senha, token e documento; o DTO `WithSensitiveData` fica no mesmo assunto, para o método de leitura sensível |
| 6 | porta e token | `creating-persistence-ports` | Anêmico: `IXxxDao` com os métodos do pedido e token `XxxDao`. Agregado: `IXxxDao` só leitura e `IXxxRepository` (`save`, `edit`, `findById` → `Entity \| null`, `delete(id)`), tokens `XxxDao` e `XxxRepository` |
| 7 | adapter em `infra/driven/persistence/prisma/` | `implementing-prisma-adapters` | Classe `XxxDaoAdapterPrisma`. Com agregado, também `XxxRepositoryAdapterPrisma`. Leitura sensível: segundo select e método explícito |
| 8 | `application/persistence/<modulo>-persistence.module.ts` | `creating-persistence-module` | `XxxPersistenceModule`. Anêmico: só `TOKENS.XxxDao`. Agregado: `XxxDao` e `XxxRepository` |
| 9 | `application/usecases/<verbo>-<modulo>/<verbo>-<modulo>.service.ts`, uma pasta por use case do pedido | `creating-use-case` | Ver a tabela de use cases |

Use cases. Classe sem sufixo `Service`. Uma pasta por verbo que o pedido nomear. Não inventar pasta.

| Caso | Template | Fala com | Registro ausente |
|---|---|---|---|
| Anêmico, leitura ou escrita | anêmico | `TOKENS.XxxDao` | Devolve `null` ou ignora. Não lança `NotFound` |
| Agregado, query | query | `TOKENS.XxxDao`. Não instancia entidade | Devolve `null` |
| Agregado, comando | comando rico | factory ou método da entidade e `TOKENS.XxxRepository` | O que o pedido pedir. Pode ignorar |

4. Escrever `src/app/<modulo>/<modulo>.module.ts` pelo template desta skill. `imports`: só `XxxPersistenceModule`. O array de classes do passo 3 vai em `providers` e em `exports`. Sem `controllers`.

5. Localizar o consumidor (seção "Bloco base") e inserir `XxxModule` no array `imports`, mantendo os imports que já existem. Não editar `src/app.module.ts`. Não registrar este módulo no `AppModule`.

6. Spec só aqui, não no meio da tabela. Em cada use case e no DAO, ler `inventorying-test-scenarios`. Com agregado, também na entidade, na factory e no repository. Bug possível: parar e perguntar. Sem pendência: `writing-unit-tests` se o inventário tiver seção unitária (use case; com agregado, entidade e factory); `writing-integration-tests` se tiver seção de integração (use case e DAO; com agregado, repository). DAO e repository sem spec unitário. Sem spec de DTO, porque módulo sem HTTP não tem DTO validado pelo `ValidationPipe`, e sem spec de enum. Sem inventário, sem spec.

7. Checklist de entrega.

## Quando usar

| Sintoma | Ação |
|---|---|
| Módulo só consumido por outro, sem HTTP | Seguir o fluxo e delegar cada arquivo |
| Pedido de módulo no estilo Account, scaffold interno, ou esta skill pelo nome | Seguir o fluxo |

### Quando não usar

| Situação | Onde vai |
|---|---|
| Escolher entre anêmico, rico e interno | Skill `choosing-module-shape` |
| CRUD HTTP sem invariante | Skill `scaffolding-anemic-module` |
| HTTP em que estado inválido não pode existir | Skill `scaffolding-rich-module` |
| Um arquivo só (DTO, porta, adapter, use case, enum, VO, entidade, factory) | Skill pontual da tabela do fluxo |
| Controller | Skill `creating-controllers` |

## Bloco base

Localizar o módulo consumidor pelo export antes de inserir o import. Serve para reusar. Ausente: parar e informar. Não há template de recriação — esta skill não cria o consumidor nem o `AppModule`.

| Símbolo | Localizar por | Destino se ausente |
|---|---|---|
| `<Consumidor>Module` | `export class <Consumidor>Module` | Parar. Não criar o módulo consumidor |

```bash
grep -rn "export class <Consumidor>Module" src
```

Trocar `<Consumidor>Module` pela classe que o pedido nomeou. O import de `XxxModule` no template usa o caminho `src/app/<modulo>/<modulo>.module`.

## Templates

Código do módulo interno e do encaixe no consumidor. O resto dos arquivos nasce na skill da tabela do fluxo.

Substituir `<modulo>` pelo kebab singular, `Xxx` pelo PascalCase e cada classe de use case pela lista criada no passo 3. O exemplo abaixo mostra uma classe. O array leva todas as classes do passo 3 e nenhuma a mais.

```ts
import { Module, Provider } from '@nestjs/common';
import { XxxPersistenceModule } from 'src/app/<modulo>/application/persistence/<modulo>-persistence.module';
import { FindXxxById } from 'src/app/<modulo>/application/usecases/find-<modulo>-by-id/find-<modulo>-by-id.service';

const providers: Provider[] = [
  FindXxxById,
];

@Module({
  imports: [
    XxxPersistenceModule,
  ],
  providers: [...providers],
  exports: [...providers],
})
export class XxxModule {}
```

`FindXxxById` ilustra o lugar da classe. Trocar pelo use case que o pedido nomeou. Vários use cases: um import e um item no mesmo array para cada um.

Encaixe no consumidor que já existe. Manter os imports que já estão no arquivo e acrescentar `XxxModule`.

```ts
import { XxxModule } from 'src/app/<modulo>/<modulo>.module';

@Module({
  imports: [
    // cada import que já existe no arquivo permanece
    XxxModule,
  ],
})
export class ConsumidorModule {}
```

O bloco mostra a linha nova dentro do consumidor que já existe. O comentário marca os imports anteriores: eles permanecem no arquivo. `ConsumidorModule` é a classe que o grep encontrou.

## Fora do escopo

| Artefato | Delegar a |
|---|---|
| Escolha da forma do módulo | Skill `choosing-module-shape` |
| Módulo HTTP anêmico | Skill `scaffolding-anemic-module` |
| Módulo HTTP rico | Skill `scaffolding-rich-module` |
| Controller | Skill `creating-controllers` |
| Env | Skill `using-core-config` |
| Logger | Skill `using-logger` |
| Gateway de vendor (Redis, SMTP, S3, HTTP de terceiro) | Skill `using-ports-and-adapters` |
| Seed | Skill `writing-prisma-seed` |
| Cache de leitura | Skill `caching-a-read` |
| Collection Postman | Skill `syncing-postman-collection` |
| Spec de integração de use case, DAO ou repository Prisma | Skill `writing-integration-tests` |
| Teste e2e | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] O caso é módulo sem HTTP; o consumidor foi nomeado no pedido e já existia
- [ ] Sem controller, sem rota e sem registro em `AppModule`
- [ ] Pasta kebab singular; use cases, colunas e métodos do DAO são os do pedido
- [ ] Sem agregado: só `IXxxDao` e `XxxDaoAdapterPrisma`; sem entidade, factory e repository
- [ ] Com agregado: entidade, factory, DAO só leitura e repository; continua sem controller
- [ ] Use case não lança `NotFound` por registro ausente
- [ ] Segredo só se o pedido pediu: select padrão sem senha, token e documento; leitura sensível em método e DTO próprios
- [ ] Cada arquivo da tabela do fluxo foi escrito pela skill citada, não por template copiado para cá
- [ ] `<modulo>.module.ts` com import absoluto `src/...`, um array só em `providers` e `exports`, sem `controllers`
- [ ] O consumidor importa `XxxModule` e conserva os imports que já existiam
- [ ] `inventorying-test-scenarios` rodou em cada use case e no DAO antes do spec; com agregado, também na entidade, na factory e no repository; bug possível parou e perguntou; `writing-unit-tests` implementou só a seção unitária; `writing-integration-tests` só a de integração; DAO e repository sem spec unitário; sem spec de DTO ou de enum
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
