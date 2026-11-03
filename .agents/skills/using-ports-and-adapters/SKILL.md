---
name: using-ports-and-adapters
description: Aplica ports and adapters em src/infra com IXxxGateway, adapter real, adapter fake, ACL (anti-corruption layer), XxxModule.register() e TOKENS. Use quando o usuário pedir para criar gateway de infra, adapter, port, hexagonal, ACL, anti-corruption, mapear contrato de vendor, integrar Redis, SMTP, S3, API externa, fake de teste ou trocar implementação sem alterar use case.
---

# Using Ports and Adapters

Cria e consome **ports** (`IXxxGateway`) e **adapters** em `src/infra/<kebab>/`, com troca prod/teste via Nest DI e `TOKENS`.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de ports and adapters.**

Todo o padrão — pastas, nomes, token, `register()`, fake vs real, ACL, DTO de porta vs DTO de vendor, log, erro — está definido aqui e apenas aqui.

Antes de escrever código, **não**:

- leia, abra ou busque outros `*.gateway.ts`, `*.module.ts` ou adapters em `src/infra/` para copiar formato
- rode grep/glob por `implements I`, `AdapterGateway`, `static register`, `useClass: isTest`
- inspecione capabilities existentes em `src/infra/` para inferir convenções
- copie estilo de adapter legado, mesmo que divirja desta skill

Se um adapter existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou (contrato da API, SDK, regra de negócio)
- arquivo que exporta `TOKENS` — só para **inserir** o Symbol novo (seção "Bloco base")
- registro de vendors (`export const <Capability>Vendor`) — só para **inserir** vendor no objeto/type/guard (skill `using-core-config`)
- arquivo que exporta `LogContext` — só para **inserir** `LogContext` + tipo do mapa, se o adapter for logar (skill `using-logger`)
- o módulo Nest que vai **importar** `XxxModule.register()`

Exceção: usuário apontar um arquivo como referência, ou pedir edição de um gateway que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que o conceito é um port de infra (não DAO/Repo de módulo, não controller, não helper)
- [ ] 2. Definir a interface IXxxGateway na linguagem da aplicação (ACL: zero tipo/campo/erro de vendor) — leia `references/templates.md` seção 1 antes de escrever a porta
- [ ] 3. Adicionar TOKENS.XxxGateway (localizar TOKENS pelo export; ausente → seção "Bloco base")
- [ ] 4. Escrever adapter real (ACL: mapear vendor ↔ porta em métodos privados) e adapter fake — leia `references/templates.md` seções 2 e 3 antes de escrever
- [ ] 5. Escrever XxxModule.register() (mapa Binding class/modules/providers + `*_VENDOR` via using-core-config) — leia `references/templates.md` seção 4 antes de escrever
- [ ] 6. LogContext novo, se o adapter logar
- [ ] 7. Erro: reusar ExternalApiError ou criar via creating-custom-errors
- [ ] 8. Specs via writing-unit-tests (obrigatório no adapter real; fake se tiver lógica)
- [ ] 9. Importar XxxModule.register() onde o port for injetado — leia `references/templates.md` seção 5 antes de escrever o consumo
- [ ] 10. Checklist de entrega
```

## Quando usar

Hexagonal (ports & adapters): o **centro** (application/domain) não conhece Redis, AWS, ViaCEP, Nodemailer. Conhece só a **porta** (interface). O **adapter** fala com o mundo externo e traduz para o contrato da porta.

`src/infra` concentra **driven adapters** compartilhados: a aplicação chama o port; o adapter chama o serviço externo.

| Critério | Significa |
|----------|-----------|
| Dependência invertida | Use case importa `IXxxGateway`, nunca a classe Redis/S3/SDK |
| Troca de implementação | Prod e teste (ou vendor B) sem mudar service/guard |
| Fronteira externa | I/O: cache, e-mail, storage, HTTP de terceiro, logger de arquivo |
| Contrato estável | Métodos e DTOs da porta são linguagem da aplicação, não do vendor |
| Fake determinístico | Teste não sobe Redis/S3/SMTP |
| ACL | Adapter traduz modelos; a API não entende o contexto do sistema externo |

### Anti-corruption layer (ACL)

O **adapter é a ACL**. Isola o bounded context da aplicação do modelo do sistema externo.

Dessa forma, a API não precisa entender o contexto dos sistemas externos e será necessário poucos ajustes caso eles mudem o contrato.

| Lado | Pertence a | Exemplos |
|------|------------|----------|
| Porta + `dtos/` da capability | Linguagem da aplicação | `zipCode`, `street`, `to`, `code`, `ttlInSeconds` |
| `adapters/<vendor>/` + DTO de vendor | Linguagem do externo | `cep`, `logradouro`, `RedisClientType`, `S3`, `SentMessageInfo` |

**Obrigatório no adapter real:**

1. Traduzir **entrada** da porta → payload/comando do vendor (`private toVendor…`)
2. Traduzir **saída** do vendor → DTO da porta (`private toPort…`)
3. Traduzir **falha** do vendor → `AppException` (`ExternalApiError` ou erro da skill `creating-custom-errors`)
4. Normalizar valores na ACL (máscara, `''` vs `null`, unidades) — use case recebe dado já nosso

**Proibido vazar na porta** (`IXxxGateway` e DTOs em `src/infra/<kebab>/dtos/`):

- Tipos de SDK/framework de I/O: `Express.Multer.File`, `AxiosResponse`, `RedisClientType`, `S3`, `Logger` do Winston, `SentMessageInfo`
- Nomes de campo do vendor: `cep`, `logradouro`, `ETag`, `MessageId`, `Body.Location`
- Códigos/erros do vendor (`erro: true` da ViaCEP, códigos AWS) sem traduzir
- Métodos com nome de produto (`lookupViaCep`, `putObjectS3`)
- Import de pacote do vendor no arquivo da porta

Mudou o JSON da ViaCEP / a API do S3 / o comando Redis? **Só** o adapter real e o DTO em `adapters/<vendor>/dtos/` mudam. Porta, fake, use case e token ficam iguais.

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Persistência de entidade do módulo (Prisma `save`/`findById`) | Fora (sem skill; planejada creating-persistence-adapters) — port `IXxxRepository` / `IXxxDao` no módulo |
| HTTP de entrada (controller) | Fora (sem skill; planejada creating-controllers) — driving adapter no módulo (`infra/drivers/http`) |
| Validação de request, Swagger/OpenAPI, filter Nest | Fora (sem skill) — não são ports |
| `PrismaService` / `DatabaseModule` | Cliente compartilhado, não é `IXxxGateway` |
| Helper puro in-process (montar chave de cache) | Função/classe no próprio recorte, sem porta |
| Primitivo ou VO | Skill `creating-value-objects` |

## Estrutura de pastas

```
src/infra/<kebab>/
  <kebab>.gateway.ts
  <kebab>.module.ts
  <kebab>.module.spec.ts        # opcional — testa register()
  dtos/
    <kebab>.dto.ts
  helpers/                      # opcional — helper puro do capability
    <helper>/
      <helper>.builder.ts
      <helper>.builder.spec.ts
  adapters/
    fake/
      <kebab>-fake.gateway.ts
      <kebab>-fake.gateway.spec.ts
    <vendor>/
      <kebab>-<vendor>.gateway.ts
      <kebab>-<vendor>.gateway.spec.ts
      dtos/
        <vendor>.dto.ts
```

`dtos/` na raiz do capability: contrato da **porta** (o que o use case vê).
`adapters/<vendor>/dtos/`: formato do **vendor**; nunca importado fora desse adapter.

`helpers/`: classe ou função pura, in-process, do capability — sem I/O, sem porta, sem token
(ex.: builder que monta a chave de cache).
Exportada direto, importada pelo consumidor via `new`. Spec obrigatório se tiver lógica.

`<kebab>.module.spec.ts`: spec do `register()` — recomendado, principalmente com 2+ vendors reais.
Cobre: `NODE_ENV=test` força `fake` mesmo com `*_VENDOR` real; vendor real fora de test devolve o
binding certo (`imports` + `useClass`); `*_VENDOR=fake` fora de test; `throw` com `*_VENDOR`
inválido e ausente; `module`/`exports` com o token. Salvar e restaurar `process.env.NODE_ENV` e
`process.env.*_VENDOR` em `beforeEach`/`afterEach`. Formato: skill `writing-unit-tests`.

**Sem** barrel `index.ts`.

## Nomeação

| Peça | Forma | Exemplo |
|------|--------|---------|
| Pasta | kebab-case | `cep-lookup`, `upload-file` |
| Interface | `I` + Pascal + `Gateway` | `ICepLookupGateway` |
| Token | Pascal + `Gateway` (sem `I`) | `CepLookupGateway` |
| Adapter real | Pascal + Vendor + `AdapterGateway` | `CepLookupViacepAdapterGateway` |
| Adapter fake | Pascal + `FakeAdapterGateway` | `CepLookupFakeAdapterGateway` |
| Módulo Nest | Pascal + `Module` | `CepLookupModule` |
| Arquivo da porta | `<kebab>.gateway.ts` | `cep-lookup.gateway.ts` |
| Arquivo real | `<kebab>-<vendor>.gateway.ts` | `cep-lookup-viacep.gateway.ts` |
| Arquivo fake | `<kebab>-fake.gateway.ts` | `cep-lookup-fake.gateway.ts` |

Vendor no nome e na pasta: `redis`, `winston`, `nodemailer`, `viacep`, `aws-s3`, `fake`.

## Modificadores de acesso

**Obrigatório em classe de comportamento** (adapter real, adapter fake, helper): método, getter, setter e atributo declaram `public`, `private` ou `protected` — inclusive públicos.

**Exceções (sem modificador):**

- `constructor` público — sem a palavra `public`. Parameter properties no construtor usam `private readonly` (e `@Inject` quando for token).
- `static register(): DynamicModule` no `XxxModule` — sempre `static register`, nunca `public static register`.
- Campos de classe de DTO (`dtos/<kebab>.dto.ts` e `adapters/<vendor>/dtos/<vendor>.dto.ts`) — a classe descreve só a forma do dado: `zipCode: string;`, não `public zipCode: string;`.

## Bloco base

Localizar cada símbolo pela busca do export antes de escrever. Se não existir, criar conforme a coluna "Se ausente".

| Símbolo | Localizar por | Se ausente |
|---------|---------------|------------|
| `TOKENS` | `const TOKENS = {` | criar em `src/core/di/token.ts` pelo template abaixo |
| `ExternalApiError` | `export class ExternalApiError` | skill `creating-custom-errors` (seção "Bloco base") |
| `ConfigService`, `ConfigModule`, `Environment`, registro de vendors | export de cada símbolo | skill `using-core-config` (seção "Bloco base") |
| `ILoggerGateway`, `LogContext` | `export enum LogContext` | skill `using-logger` (seção "Bloco base") |

```bash
grep -rn "const TOKENS = {" src
```

`TOKENS` — nasce com o primeiro token; cada port novo acrescenta uma linha (seção "Token"):

```ts
const TOKENS = {
  XxxGateway: Symbol.for('XxxGateway'),
};

export { TOKENS };
```

## Templates

Antes de escrever porta, adapter real, adapter fake, `XxxModule.register()` ou o consumo, leia `references/templates.md`.

| Peça | Seção em `references/templates.md` |
|------|-------------------------------------|
| Porta | 1. Porta |
| Adapter real (ACL) | 2. Adapter real (ACL) |
| Adapter fake | 3. Adapter fake |
| `register()` | 4. Módulo — padrão `register()` |
| Consumo | 5. Consumo (application / guard / filter) |

## Token

No arquivo que exporta `TOKENS` (seção "Bloco base"), **adicionar** uma linha no objeto (não reordenar o resto):

```ts
XxxGateway: Symbol.for('XxxGateway'),
```

O string do `Symbol.for` é **idêntico** à chave. Application injeta `TOKENS.XxxGateway`, nunca a classe do adapter.

## Log

Fonte da verdade: skill **`using-logger`**. Injetar `ILoggerGateway`, `LogContext` + mapa, `debug`/`error`, segredos.

Resumo mínimo (detalhe só naquela skill): adapter real loga falha com `adapter: '<vendor>'`; contexto novo = enum + type + mapa no mesmo diff; **não** editar Winston só por contexto novo.

## Erros

Integração externa que o cliente precisa saber: `ExternalApiError` (`HttpStatus.SERVICE_UNAVAILABLE`). Reusar. Se não existir, criar com skill `creating-custom-errors` (seção "Bloco base").

Erro com semântica nova: skill `creating-custom-errors` — localização típica `src/shared/errors/` se for infra compartilhada.

Não lançar `HttpException` / `Error` nativo no adapter.

## Regras

- Application depende da **porta**; adapter depende do **vendor**
- Adapter = ACL: `toPort` / `toVendor` privados; use case nunca vê modelo externo
- Valor devolvido ao use case já está no DTO da porta
- Config (URL, bucket, host, `*_VENDOR`) só em `ConfigService` — se a chave não existir, adicionar lá, não hardcode
- Binding de vendor: `Record<XxxVendor, { class, modules, providers }>` + type guard; `NODE_ENV=test` força `fake`; fora de test `*_VENDOR=fake` também válido
- Um capability = uma porta. Não misturar SMTP + S3 na mesma interface
- Fake e real implementam **todos** os métodos da porta (fake já devolve DTO da porta)
- Comentário só se citar contrato/docs do vendor

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| `<kebab>-<vendor>.gateway.spec.ts` | Skill `writing-unit-tests` (**obrigatório**) |
| Fake com lógica (TTL, Map, lista de envios) `.spec.ts` | Skill `writing-unit-tests` (**obrigatório**) |
| Fake no-op sem ramo | Spec opcional |
| `<kebab>.module.spec.ts` | Skill `writing-unit-tests` (**recomendado**) |
| `helpers/<helper>/<helper>.builder.spec.ts` | Skill `writing-unit-tests` (**obrigatório** se tiver lógica) |
| Classe de erro nova | Skill `creating-custom-errors` |
| DAO/Repository Prisma do módulo | Fora (sem skill; planejada creating-persistence-adapters) — não usar esta skill |
| Controller HTTP | Fora (sem skill; planejada creating-controllers) |
| Ligar o VO/use case além do `@Inject` | Fora (sem skill) — só se o usuário pedir |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Conceito é port de infra compartilhado (não persistência de módulo, não controller)
- [ ] Pasta `src/infra/<kebab>/` com porta, `register()`, adapter real, adapter fake
- [ ] Interface `IXxxGateway`; token `TOKENS.XxxGateway` = `Symbol.for('XxxGateway')`
- [ ] Blocos base (`TOKENS`, `ExternalApiError`, `ConfigService`/`ConfigModule`/`Environment`, registro de vendors, `LogContext`) localizados pelo export ou criados pelo bloco base da skill dona; imports com o caminho real
- [ ] Application/domain não importam adapter, SDK nem tipo de vendor/Multer
- [ ] Porta e DTOs da capability: linguagem da aplicação; zero campo/tipo/erro do vendor
- [ ] Adapter real é ACL: `toPort`/`toVendor` (ou equivalentes privados); falha do vendor traduzida
- [ ] DTO da porta ≠ DTO do vendor; DTO de vendor só em `adapters/<vendor>/dtos/`
- [ ] Binding via mapa `{ class, modules, providers }` (inclui entry `fake`); throw se vendor inválido
- [ ] Vendor via objeto `XxxVendor` no registro de vendors (sem literal solto); `*_VENDOR` + `requiredWhen` via `using-core-config`
- [ ] Teste força fake via `NODE_ENV === Environment.Test`; `*_VENDOR=fake` válido fora de test
- [ ] Falha de I/O: `ExternalApiError` ou erro via `creating-custom-errors` (reuso primeiro)
- [ ] Log (se houver): skill `using-logger` (contexto + mapa; `adapter` no payload; sem segredo)
- [ ] Modificador explícito em todo membro; `constructor` público sem `public`
- [ ] Spec do adapter real existe, escrito com `writing-unit-tests`, suíte passando
- [ ] Spec do fake existe se o fake tiver lógica; suíte passando
- [ ] `XxxModule.register()` importado no módulo Nest consumidor (ou `@Global()` justificado)
- [ ] Nenhum padrão copiado de outros adapters do repo — apenas esta skill
