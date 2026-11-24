# Documentação NestJS: da v10 para a v12

Comparação arquivo a arquivo do Markdown em `content/`, entre o branch `10.0.0` (commit `44c92504`) e o `master` (commit `419b443`, 23 de novembro de 2026) do repositório [nestjs/docs.nestjs.com](https://github.com/nestjs/docs.nestjs.com).

O intervalo cobre tudo o que a documentação passou a dizer depois da v10, inclusive o que entrou na época da v11. O guia `migration.md` da v12 descreve só a passagem **11 → 12**.

212 arquivos de `content/` diferem. Nenhum arquivo presente nas duas árvores ficou idêntico. Troca de link, import com sufixo `.js`, typo e reescrita de prosa não entram aqui.

## Sumário

1. [Panorama](#1-panorama)
2. [Para onde cada capítulo foi](#2-para-onde-cada-capítulo-foi)
3. [O que saiu sem sucessor](#3-o-que-saiu-sem-sucessor)
4. [Plataforma, CLI e projeto novo](#4-plataforma-cli-e-projeto-novo)
5. [Núcleo do framework](#5-núcleo-do-framework)
6. [HTTP](#6-http)
7. [Aplicação](#7-aplicação)
8. [Dados](#8-dados)
9. [Segurança](#9-segurança)
10. [GraphQL](#10-graphql)
11. [OpenAPI](#11-openapi)
12. [WebSockets](#12-websockets)
13. [Microsserviços](#13-microsserviços)
14. [AI](#14-ai)
15. [MCP](#15-mcp)
16. [Observabilidade](#16-observabilidade)
17. [Confiabilidade](#17-confiabilidade)
18. [Migração e deploy](#18-migração-e-deploy)
19. [FAQ](#19-faq)
20. [Receitas](#20-receitas)
21. [Tutoriais](#21-tutoriais)
22. [Pacotes que a v12 documenta](#22-pacotes-que-a-v12-documenta)

---

## 1. Panorama

| | Quantidade |
|---|---|
| Alterados no mesmo caminho | 104 |
| Novos | 78 |
| Removidos | 27 |
| Renomeados pelo git (similaridade ≥ 40%) | 3 |
| Idênticos nas duas árvores | 0 |

Três movimentos organizam quase toda a diferença:

- A pasta `content/techniques/` foi dissolvida. O que é da aplicação foi para `application/`. O que é do transporte HTTP foi para `http/`. Banco e cache foram para `data/`.
- Vários pacotes oficiais novos passam a ser o caminho documentado: autenticação, autorização, cliente HTTP, storage, i18n, mail, webhooks, filas BullMQ, Drizzle, AI, MCP, locks, idempotência, outbox, workflows, resilience e Observe.
- O CLI de monorepo troca o webpack pelo Rspack. O scaffold padrão pergunta ESM (Vitest) ou CommonJS (Jest). Entra um terceiro adapter HTTP, `NodeAdapter`.

---

## 2. Para onde cada capítulo foi

### De `techniques/` para `application/`

| v10 | v12 |
|---|---|
| `techniques/configuration.md` | `application/configuration.md` |
| `techniques/events.md` | `application/events.md` |
| `techniques/logger.md` | `application/logger.md` |
| `techniques/queues.md` | `application/queues.md` |
| `techniques/serialization.md` | `application/serialization.md` |
| `techniques/task-scheduling.md` | `application/task-scheduling.md` |
| `techniques/validation.md` | `application/validation.md` |
| `techniques/http-module.md` | `application/http-client.md` |

### De `techniques/` para `http/`

| v10 | v12 |
|---|---|
| `techniques/compression.md` | `http/compression.md` |
| `techniques/cookies.md` | `http/cookies.md` |
| `techniques/file-upload.md` | `http/file-upload.md` |
| `techniques/streaming-files.md` | absorvido em `http/file-upload.md`; streams genéricos em `http/streaming-responses.md` |
| `techniques/mvc.md` | `http/mvc.md` |
| `techniques/performance.md` | `http/performance.md` (título passa a ser “HTTP adapters”) |
| `techniques/server-sent-events.md` | `http/server-sent-events.md` |
| `techniques/sessions.md` | `http/sessions.md` |
| `techniques/versioning.md` | `http/versioning.md` |

### De `techniques/` e `recipes/` para `data/`

| v10 | v12 |
|---|---|
| `techniques/sql.md` + `recipes/sql-typeorm.md` | `data/typeorm.md` |
| seção Sequelize de `techniques/sql.md` + `recipes/sql-sequelize.md` | `data/sequelize.md` |
| `techniques/caching.md` | `data/caching.md` |
| `techniques/mongo.md` + `recipes/mongodb.md` | `data/mongo.md` |
| `recipes/prisma.md` | `data/prisma.md` |
| `recipes/mikroorm.md` | `data/mikroorm.md` |

### Outros deslocamentos

| v10 | v12 |
|---|---|
| `recipes/terminus.md` | `reliability/terminus.md` (título “Health checks”) |

---

## 3. O que saiu sem sucessor

| Arquivo v10 | O que ensinava |
|---|---|
| `recipes/automock.md` | Teste unitário com `@automock/jest` e `TestBed.create()` |
| `recipes/documentation.md` | HTML do projeto com Compodoc |
| `graphql/migration.md` | Migração GraphQL v9→v10 e v10→v11 (drivers, Federation, Apollo Server 4) |
| `openapi/migration-guide.md` | Renomeação dos decorators Swagger 3→4 |

Não há página nova, nestes diffs, que substitua esses quatro arquivos.

---

## 4. Plataforma, CLI e projeto novo

### Runtime e scaffold

Arquivos: `introduction.md`, `first-steps.md`, `migration.md`, `cli/overview.md`, `cli/usages.md`.

- A aplicação roda em Node **20.19+** ou **22.12+**. Node 21 não é suportado. Sai o requisito Node 16.
- Geradores (`nest new`, `nest generate`, `nest upgrade`) exigem Node **22.22.3+**, **24.15+** ou **26+**. O binário do CLI pede **20.11+**.
- `nest new` pergunta ESM (padrão, Vitest, oxlint) ou CommonJS (Jest, oxlint). Flags: `--type esm|cjs`, `--observe` / `--no-observe`, `--skills` / `--skip-skills`, `--minimal`, `--directory`, `--skip-tests`, `--no-interactive`, `--format`. `bun` entra como package manager. `--strict` fica sempre ligado.
- Projeto de um arquivo (`--minimal`) é só ESM e recusa `--language js`.
- O scaffold oferece NestJS Observe e agent skills (`AGENTS.md`, `@nestjs/skills`).
- Pacotes do core são só ESM. App CommonJS consome via `require(esm)`. Lambda precisa de `NODE_OPTIONS=--experimental-require-module`. Migrar o código da aplicação para ESM é opcional.
- Jest em pacote ESM-only do Nest 12 só funciona no Node **24.9+**; o outro caminho é Vitest. `nest upgrade` sobe o Jest para a 30.

### CLI

Arquivos: `cli/scripts.md`, `cli/libraries.md`, `cli/workspaces.md`, `cli/usages.md`.

- Monorepo passa a compilar com **Rspack**. Webpack no CLI e `webpack: true` no `nest-cli.json` ficam deprecated. A seção “Webpack options” sai de `workspaces.md`.
- Comandos novos: `nest upgrade` (alias `update`), da v11 para a v12, e `nest deploy` (wrapper de `mau deploy`, instala `@nestjs/mau` se faltar).
- `nest generate decorator` emite `Reflector.createDecorator()`. Flags novas: `--no-flat`, `--spec-file-suffix`, `--skip-import`, `--type`, `--crud` / `--no-crud`, `--prefix`. O schematic `angular` foi removido. O gerador de resource é só TypeScript.
- `nest build` e `nest start` ganham `--rspackPath`, `--watchAssets`, `--type-check` / `--no-type-check`, `--bundle-dependencies`, `--emit-declarations`, `--all`, `--parallel`, `--silent`, `--preserveWatchOutput`, `--sourceRoot`, `--entryFile`, `--no-shell`, `--env-file`.
- Library: prefixo padrão `@app` ou `defaultLibraryPrefix`. Em ESM o path aponta para `index.ts`. `compilerOptions` de um projeto do monorepo não faz merge com o da raiz. Entram `emitDeclarations`, `bundleDependencies` e `includeLibraryAssets`.
- `nest upgrade` também ajusta TypeScript 6 (peer de `@nestjs/schematics`), Rspack, GraphQL, NATS, Joi/config e avisa mudanças de comportamento. Aceita `--dry-run`, `--tag`, `--collection`, `--observe` / `--no-observe`.

### Devtools

- `devtools/overview.md`: `snapshot: true` no `NestFactory`, `DevtoolsModule.register({ http, port })`. Sai o aviso de instalar `@nestjs/graphql@11`. Erro de dependência usa `PartialGraphHost`, `abortOnError: false` e o arquivo `graph.json`. A UI Sandbox passa a se chamar Playground e pede um token de sessão. Há audit de regras e export de `SerializedGraph`.
- `devtools/ci-cd.md`: exemplos sobem de Node 16 para Node 22. `publishOptions` fica documentado por completo (`targetBranch`, `trigger`). O plano Enterprise é linkado.

---

## 5. Núcleo do framework

### Bootstrap e módulos

- `modules.md`: `NestFactory.create({ controllers, providers, imports })` sem classe `AppModule`. O Nest sintetiza o módulo raiz. O mesmo vale para `createApplicationContext` e `createMicroservice`. Propriedade desconhecida falha como em `@Module()`. Não usar quando há `configure()`, lifecycle, `app.select(AppModule)` ou `nest generate`.
- `application-context.md`: aplicação standalone não executa middleware, interceptor, pipe nem guard. `app.get()` aceita qualquer token. `app.select()` de módulo dinâmico precisa da mesma referência devolvida por `register()`. `app.close()` dispara o shutdown.
- `components.md`: `import type` e interface apagam o token de DI (“Nest can't resolve dependencies”). O remédio é `@Inject()` com custom provider. `@Optional()` injeta `undefined`; o fallback fica na classe.
- `fundamentals/dependency-injection.md`: interface usa token `Symbol` ou `string` mais `@Inject()`. Classe abstrata serve de token com `useClass`, sem `@Inject()` no construtor. `@Inject()` também vale em propriedade.
- `fundamentals/dynamic-modules.md`: o tutorial deixa de ser um `ConfigModule` lendo `.env` e passa a ser `IdGeneratorModule`. `registerAsync` ganha a tabela `imports`, `useFactory`, `inject`, `useClass`, `useExisting`, `provideInjectionTokensFrom`. Entram `ConfigurableModuleOptionsFactory`, `setFactoryMethodName`, `setExtras` (`isGlobal`) e a extensão manual com `OPTIONS_TYPE` / `ASYNC_OPTIONS_TYPE`.
- `fundamentals/lazy-loading-modules.md`: `LazyModuleLoader#load(factory, { logger: false })`.
- `fundamentals/module-reference.md`: `ModuleRef#get()` lança se não achar a instância. O escopo inclui provider que ficou request-scoped só porque depende de outro.
- `fundamentals/discovery-service.md` (novo): `DiscoveryModule` e `DiscoveryService` em `@nestjs/core`. `getProviders()`, `getControllers()`, filtro `{ include }`, `DiscoveryService.createDecorator()`, `getMetadataByDecorator()`, `getProviders({ metadataKey })`.

### Lifecycle, escopo e metadata

- `fundamentals/lifecycle-events.md`: `onModuleInit` e `onApplicationBootstrap` disparam em `app.init()`, `app.listen()` e `createApplicationContext()`. A ordem segue a distância do módulo raiz; o shutdown é o inverso. `gracefulShutdown` dos transports atrasa `onApplicationShutdown`. `onModuleDestroy()` não recebe argumento. `app.close()` não encerra o processo.
- `fundamentals/provider-scopes.md`: a proibição de request scope em gateway WebSocket sai. Na v12 o escopo é a conexão do socket. O token `REQUEST` é sempre request-scoped e arrasta quem depende dele. `durable` só é lido em provider com `Scope.REQUEST` explícito. ALS e `TracerService` aparecem como alternativa para user/tenant. A doc cita latência típica de até cerca de 5%.
- `guards.md` e `fundamentals/execution-context.md`: metadata passa a ser `Reflector.createDecorator<string[]>()`, uso `@Roles(['admin'])`, leitura `reflector.get(Roles, ...)`. `@SetMetadata` fica como caminho de baixo nível. Vários `APP_GUARD`, com ordem de execução. O token do pseudo-provider não sai em `app.get()`. `getAllAndMerge` documenta a ordem `['admin', 'user']`. `getType()` devolve `'http' | 'rpc' | 'ws'`.
- `migration.md`: `@Optional()` não é herdado quando a subclasse declara o próprio construtor (v12.0). No 12.1 o comportamento da v11 volta se a subclasse não declara construtor.

### Rotas, pipes, filtros e middleware

- `controllers.md`:
  - `@Cookies()` e `@SignedCookies()`.
  - `@Body()`, `@Query()`, `@Param()` e `@RawBody()` aceitam `{ schema, pipes }` (Standard Schema). O pipe é `StandardSchemaValidationPipe`, ou um pipe que lê `metadata.schema`.
  - `@QueryMethod()` para o verbo HTTP QUERY.
  - Wildcard no formato `abcd/*`. Express v5 usa wildcard nomeado. Fastify não aceita asterisco no meio da rota. Sai o padrão `ab*cd`.
  - `routeConflictPolicy`: `duplicate` ou `shadow`, níveis `'off' | 'warn' | 'error'`. Conflitos viram `RouteConflictException` na subida. `routeResolutionStrategy`: `'declaration'` (padrão) ou `'specificity'`.
  - Redirect dinâmico tipado com `HttpRedirectResponse`.
  - Query parser extended no Express. Fastify e Node usam `querystringParser` com `qs`.
  - Subdomínio também no Node adapter, não só no Express.
- `custom-decorators.md`: `@HostParam(param?)`. Decorator custom aceita `schema`, por exemplo `@User('email', { schema: z.email() })` com `validateCustomDecorators: true`.
- `pipes.md`: pipes novos `StandardSchemaValidationPipe` e `ParseDatePipe`. `ArgumentMetadata.schema`. `ParseUUIDPipe` cobre UUID v1–v8, Nil e Max; `version` também numérico a partir do 12.1.2; tipo exportado `UUIDVersion`. O exemplo de validação custom sai de Joi e vai para Zod. Pipes `Parse*` documentam `optional: true`.
- `exception-filters.md`: a partir do 12.2, erro `http-errors` com `expose: false` em 5xx devolve a reason phrase padrão, não `message`. `Error` passado como `response` de `HttpException` não vai para o cliente; o caminho é `cause`. Built-ins (`HttpException`, `WsException`, `RpcException`) não logam por padrão; a hierarquia é `IntrinsicException`. Opção `errorCode` no JSON, distinta de `cause`. Entra `MisdirectedException`. Exceção lançada em middleware só é pega por filtro global (`useGlobalFilters` / `APP_FILTER`).
- `middlewares.md`: seção de erro com `HttpException`, `async use()` e `next(err)`. `app.use()` é da plataforma; para a camada de exception, o caminho é `MiddlewareConsumer`. Rotas `abcd/*splat` e `abcd/{*splat}`. `exclude()` não inclui o global prefix. Body parsers nomeados `express.json()` e `express.urlencoded()`, desligados com `bodyParser: false`. Node adapter usa a assinatura Express.
- `interceptors.md`: `tap()` não roda se o handler lança; usar o callback `error` ou `finalize()`. Mapping de resposta é incompatível com `@Res()` salvo `passthrough: true`. `timeout()` não cancela trabalho que o handler já começou.

### Testes

`fundamentals/unit-testing.md`: os exemplos do scaffold passam a ser Vitest (`vi.spyOn`, `vi.fn`). `CapturingLogger` em `@nestjs/testing` (`setLogger`, `assertLogged`, `assertNotLogged`, `entries`, `find`, `filter`, `clear`). `overrideModule()` de módulo dinâmico exige a mesma referência registrada, não uma chamada nova de `register()`. `HttpAdapterHost#httpAdapter` é `undefined` depois de só `compile()`. E2E com `NodeAdapter`. `createTestingModule` devolve `TestingModuleBuilder`.

`circular-dependency.md`, `platform-agnosticism.md` e `async-components.md` não ganham API. O último só perde o link da receita TypeORM.

---

## 6. HTTP

### Adapters

`http/performance.md` deixa de ser “Performance (Fastify)” e passa a ser “HTTP adapters”.

- Três adapters: `ExpressAdapter`, `FastifyAdapter` e `NodeAdapter` (`@nestjs/platform-node`). O Node é recomendado no 12.3 e está previsto como default no 13.
- `NestNodeApplication`: `useBodyParser`, arquivos estáticos, views, `app.inject()`, `maxParamLength`, `trustProxy`, `querystringParser`, body parsers com proteção contra prototype poisoning, `keepAliveTimeout`. Upload vem de `@nestjs/platform-node`. `@nestjs/serve-static` sem depender de `express`.
- Fastify: `@RouteConfig()` e `@RouteConstraints()`.
- Para permanecer no Express quando o default virar Node: `new ExpressAdapter()` explícito.
- `introduction.md` e `first-steps.md` apresentam o mesmo adapter, com o e2e passando `new NodeAdapter()`.

### Cookies, upload e streams

- `http/cookies.md`, a partir do 12.1, sem pacote obrigatório: `NestFactory.create(AppModule, { cookies: { secret } })`. Decorators `@Cookies()` e `@SignedCookies()`. `HttpAdapter#setCookie` e `clearCookie` via `HttpAdapterHost`. Opções `CookieSerializeOptions`: `path`, `domain`, `maxAge` em segundos, `httpOnly`, `secure`, `sameSite`, `partitioned`, `priority`, `signed`. Assinatura no formato `cookie-signature` (`s:`), com rotação de secrets. A receita da v10 (“escreva seu `createParamDecorator`”) sai. `cookie-parser` e `@fastify/cookie` continuam podendo coexistir.
- `http/file-upload.md` une o upload antigo e `techniques/streaming-files.md`. Fastify multipart fica ao lado do Multer: `MultipartModule`, opção `multipart` no `FastifyAdapter`, `StreamableFileInterceptor`. Interceptors: `FileInterceptor`, `FilesInterceptor`, `FileFieldsInterceptor`, `AnyFilesInterceptor`, `NoFilesInterceptor`. `MulterModule.register` / `registerAsync` com merge de `limits` (12.0.4+) e tratamento de nullish (12.5+). Validação de array em `@UploadedFiles()`. `ParseFilePipe`, `ParseFilePipeBuilder`, `MaxFileSizeValidator`, `FileTypeValidator`. `StreamableFile` ganha `setErrorHandler()` e `setErrorLogger()` (Express e Node; no Fastify o erro vai para exception filter).
- `http/streaming-responses.md` (novo, `@nestjs/core` ≥ 12.4): retorno pode ser async generator, `Response`, `ReadableStream`, async iterable ou `fetch()`. Objeto vira NDJSON. Erro antes e depois do primeiro chunk se comporta diferente. `@Res()` sem `passthrough` ignora o generator. HEAD não o inicia.
- `http/server-sent-events.md`: `@Sse()` aceita `Promise<Observable>`. `@SseSignal()` com `AbortSignal`. `MessageEvent` ganha `comment`. IDs incrementais. Status e headers com `@Res({ passthrough: true })` a partir do 12.1.3. `maxPendingDataLength` no decorator. `finalize` no Observable.

### Versionamento, compressão, MVC, sessão e webhooks

- `http/versioning.md`: `enableVersioning({ type, defaultVersion, prefix, header, key, extractor })`. Com versionamento ligado, rota sem versão não é mais “sempre 404”: valem `VERSION_NEUTRAL` e `defaultVersion`. Middleware num path compartilhado, nos modos Header, Media Type e Custom, afeta todas as versões; o texto manda usar guard ou interceptor. A ordem de registro entre rota neutra e rota versionada importa no Express quando o tipo não é URI.
- `http/compression.md`: no Fastify, `@fastify/compress`, com ordem `zstd`, `br`, `gzip`, `deflate` e `brotliOptions`.
- `http/mvc.md`: layout Handlebars, `NodeAdapter` com `setLocal('layout')`. No Fastify, `res.view()` como alternativa a `@Render()`.
- `http/sessions.md`: a mesma receita `express-session` / `@fastify/secure-session`.
- `http/webhooks.md` (novo): `@nestjs/webhooks`, stores `@nestjs/webhooks/postgres` e `mysql`, em cima de `@nestjs/outbox`. `WebhooksModule.forRoot()` / `forRootAsync()` com `outgoing`, `incoming`, `delivery`, `worker`, `allowInMemoryStorage`, `transport`. API: `Webhooks#dispatch(tx, message)`, `WebhookEndpoints`, `WebhookDeliveries`, `WebhookWorker`, `WebhookVerifier`. Assinaturas `standard`, `stripe`, `github` ou `WebhookSignatureScheme` custom. `HttpWebhookTransport` bloqueia SSRF (`allowHttp`, `allowPrivateNetworks`, `allowedAddresses`). Eventos `WebhooksEvents`.

---

## 7. Aplicação

### Configuração

`application/configuration.md` (`@nestjs/config`).

- `validationSchema` aceita Standard Schema (Zod, Valibot, ArkType). Joi continua, na v18+, com as opções da lib em `validationOptions.libraryOptions` em vez de `allowUnknown` / `abortEarly` soltos.
- Opções que o capítulo passa a tratar: `override` (o `.env` vence `process.env`), `parser` (no lugar de `dotenv.parse`, por exemplo `util.parseEnv`), `validatePredefined`, `expandVariables`, `skipProcessEnv`, `ignoreEnvFile`, `cache`, `load`, `isGlobal`, `envFilePath`.
- `ConfigService#getOrThrow()`. `registerAs()` com `ConfigType` e `databaseConfig.asProvider()` para o `forRootAsync` de outro módulo.
- `ConditionalModule.registerWhen(module, envKey | fn, options?.timeout)`.
- `nest start --env-file .env` e `process.loadEnvFile()` antes de importar o `AppModule`.

### Logger

`application/logger.md`.

- Nível `'fatal'` e método `LoggerService.fatal()`. `filterLogLevels()` e a env `NEST_LOG_LEVEL`.
- `ConsoleLogger`: `json`, `redact`, `structuredParams` (padrão `true` na v12; `false` volta ao formato antigo), `flattenParams`, `colors`, `compact`, `sorted`, `depth`, `maxArrayLength`, `maxStringLength`.
- `bufferLogs`, `autoFlushLogs` e `app.flushLogs()`. Aviso sobre `process.exit()` no startup.
- `ObserveModule` com `forwardLogs` e `attachTraceIdToLogs` (o log JSON ganha `traceId`).
- Pino é citado junto do Winston para volume alto.

### Filas

`application/queues.md`. O capítulo abre em BullMQ. Bull permanece como legado.

| | BullMQ (`@nestjs/bullmq`) | Bull (`@nestjs/bull`) |
|---|---|---|
| Registro | `forRoot({ connection, prefix, defaultJobOptions, settings, backendFactory, extraOptions })` | `forRoot({ limiter, redis, prefix, defaultJobOptions, settings })` |
| Postgres | `createPostgresBackend`, `migrate: true` | não |
| Fluxo | `registerFlowProducer({ name })` | não |
| Consumidor | `@Processor` + `WorkerHost#process(job)` | `@Process('name')` |
| Eventos | `@OnWorkerEvent`, `@QueueEventsListener` + `QueueEventsHost` | `@OnQueue*` |
| Recorrência | `upsertJobScheduler` (não há `repeat` em `add`) | `repeat` em `add` |
| Registro manual | `extraOptions.manualRegistration` + `BullRegistrar#register()` | não |

Os dois lados documentam fila nomeada (`forRoot('key')` + `configKey`), request scope (`JOB_REF`), sandbox por path, `forRootAsync` / `registerQueueAsync` e `pause()` / `resume()`.

### Validação e serialização

- `application/validation.md`: dois pipes convivem. `ValidationPipe` (class-validator) ganha `errorFormat` (`list` | `grouped`) e `maxErrorMessagesLength` (padrão `1_000_000`). `StandardSchemaValidationPipe` lê `schema` de `@Body`, `@Query`, `@Param`, `@MessageBody` e `@Payload`, com `transform`, `validateCustomDecorators`, `validateOptions`, `errorHttpStatusCode` e `exceptionFactory`. Aviso: `@IsOptional()` não trata `null`. `PartialType(..., { skipNullProperties: false })`. Schemas Zod com `z.strictObject`, `partial`, `pick`, `omit`, `extend`.
- `application/serialization.md`: `ClassSerializerInterceptor` com `@SerializeOptions({ type })` converte plain object antes de `instanceToPlain`. `StandardSchemaSerializerInterceptor` usa `@SerializeOptions({ schema, validateOptions })`; schema inválido vira 500. Em stream HTTP, cada objeto do yield passa pelo interceptor. `StreamableFile` e handler sem schema ficam de fora.

### Eventos, agendamento e cliente HTTP

- `application/events.md`: o aviso “subscriber não pode ser request-scoped” sai. `EventEmitterModule.forRoot()` ganha `global: false` e `inheritRequestContextId`. `@OnEvent` ganha `priority`, `prependListener` e `suppressErrors` (padrão `true`). `EventEmitterReadinessWatcher#waitUntilReady()` evita perder evento antes de `onApplicationBootstrap`.
- `application/task-scheduling.md`: um único `ScheduleModule.forRoot()` por app. `@Cron` ganha `waitForCompletion` e `disabled`, além de `name`, `timeZone` e `utcOffset` (os dois últimos não se combinam). `SchedulerRegistry#nextDate()` usa Luxon, não moment. `@OnOneInstance({ key })` de `@nestjs/locks` faz o job rodar em uma instância.
- `application/http-client.md`: o capítulo deixa de ser `@nestjs/axios` / `HttpService` (Observable) e passa a ser `@nestjs/http-client` / `HttpClient` (fetch, Promise). `register` / `forRoot` e as versões async. `@InjectHttpClient(name)` e `getHttpClientToken(name)`. Opções de request: `params`, `query`, `json`, `body`, `headers`, `timeout`, `retry`, `signal`, `throwOnHttpError`, `redirect`, `dispatcher`, `responseType`. Retry ligado por padrão em método idempotente (3 tentativas, backoff com jitter). Erros `HttpResponseError`, `HttpTimeoutError`, `HttpNetworkError`, `HttpParseError`, e `toHttpException()`. Interceptors rodam por tentativa (`request.attempt`). A tabela de migração do Axios está no capítulo.

### Storage, i18n e mail

Capítulos novos.

- `application/file-storage.md`: `@nestjs/storage`. `StorageModule.forRoot()` / `forRootAsync()`. Discos `LocalDisk`, `S3Disk`, `InMemoryDisk`, com `put`, `get`, `getBuffer`, `getText`, `stat`, `exists`, `delete`, `list`, `listAll`, `copy`, `move`, `url`, `signedUrl`, `signedUpload`. Helpers `uploadToDisk()`, `serveFile()`, `serveSignedUrl()`, `receiveSignedUpload()`, `detectContentType()`. O parser de upload continua sendo Multer ou Fastify multipart.
- `application/i18n.md`: `@nestjs/i18n`. `I18nModule.forRoot()` / `forRootAsync()`. `JsonI18nLoader`, resolvers (header, query, accept-language), `formatter`, `missingKey` (`throw` | `warn` | `ignore`), `fallbackLanguage`. `I18nService` (`t`, `translate`, `exists`, `formatNumber`, `formatDate`, `matchLocale`). `I18nContext` (`locale`, `setLocale`, `run`). Pipes `I18nValidationPipe` e `I18nStandardSchemaValidationPipe`.
- `application/mail.md`: `@nestjs/mail`. `Mailer#send(MailClass)` e `render()`. Classes `Mailable`. Transportes `FileMailTransport`, `SmtpTransport`, `ResendTransport`, `PostmarkTransport`, `SendGridTransport`, `SesTransport`, `InMemoryMailTransport`. Retry com `maxAttempts` e `maxDelay`. Eventos `nestjs:mail:sent` e `nestjs:mail:failed`. Erros `MailMessageError`, `MailSmtpError`, `MailTemplateError`, `MailProviderError`.

---

## 8. Dados

`data/overview.md` (novo) é o índice: TypeORM, Drizzle, Mongo, Prisma, MikroORM, Sequelize e cache. Pacotes mantidos pelo time Nest: `@nestjs/typeorm`, `@nestjs/drizzle`, `@nestjs/mongoose`, `@nestjs/sequelize`. Prisma não tem pacote Nest; o client gerado entra como provider.

### TypeORM

`data/typeorm.md` funde `techniques/sql.md` e a receita manual `recipes/sql-typeorm.md`. A receita de `DATA_SOURCE` / `PHOTO_REPOSITORY` sai. O fluxo é `@nestjs/typeorm`.

- `TypeOrmModule.forRoot()` ganha `toRetry`, `verboseRetryLog` e `manualInitialization` (não conecta no boot; migration não roda até `DataSource.initialize()`).
- Seção de migrations: `migrations`, `migrationsRun: true`, `synchronize: false`, ou `typeorm migration:run` no deploy. Desligar `synchronize` só em produção não cria as tabelas.
- `getRepositoryToken(entity, dataSourceName)`. `forRootAsync` documenta `useExisting` no mesmo nível de `name`. `dataSourceFactory`: se o `DataSource` voltar sem inicializar, o módulo inicializa, salvo `manualInitialization`.

### Sequelize

`data/sequelize.md` tira o Sequelize de dentro de `techniques/sql.md` e substitui a receita manual `SEQUELIZE` / `CATS_REPOSITORY`. O fluxo é `@nestjs/sequelize` e `SequelizeModule.forRoot()`. A doc aponta Sequelize v6. `autoCloseConnection` (padrão `true`) fecha a conexão no shutdown. A opção `keepConnectionAlive`, que a v10 citava, não aparece. Vários bancos usam `getConnectionToken('albumsConnection')`.

### Prisma

`data/prisma.md` passa a Prisma ORM 7 (`prisma@7`, `@prisma/client@7`). Mongo continua no Prisma 6. A tag `latest` pode apontar para um pré-release do Prisma 8 sem `migrate` nem `generate`.

- Driver adapters: `@prisma/adapter-better-sqlite3`, `@prisma/adapter-pg`, `@prisma/adapter-mariadb`, `@prisma/adapter-mssql`.
- Config em `prisma7.config.ts` (a URL sai do `schema.prisma`). Generator `provider = "prisma-client"` com `output` e, em CommonJS, `moduleFormat = "cjs"`.
- `PrismaService` recebe o adapter no construtor. Saem `enableShutdownHooks` e `$on('beforeExit')`. A conexão usa `onModuleInit` / `onModuleDestroy` e `app.enableShutdownHooks()`.
- `$transaction` em array e interativa, com `maxWait`, `timeout` e `isolationLevel`. Teste com Vitest e `overrideProvider`.

### MikroORM

`data/mikroorm.md` mira MikroORM 7 e `@mikro-orm/nestjs` v7.

- Decorators vêm de `@mikro-orm/decorators/legacy`. Driver explícito, por exemplo `@mikro-orm/sqlite`. `metadataProvider: ReflectMetadataProvider` deixa de ser o default e precisa ser passado.
- `forRoot()` sem argumentos deixa de existir. Opções Nest: `autoLoadEntities`, `registerRequestContext`, `forRoutesPath`, `scope`, `contextName`.
- Custom repository: `@Entity({ repository: () => AuthorRepository })`, injetado pela classe, sem `@InjectRepository()`.
- `@CreateRequestContext()` substitui `@UseRequestContext()`. Também `@Transactional()` e `em.transactional()`.
- Vários bancos: `contextName`, `registerRequestContext: false` em cada conexão, `MikroOrmModule.forMiddleware()`, `@InjectMikroORM`, `@InjectEntityManager`, `@InjectMikroORMs`.
- Em `forRootAsync()`, `driver` fica ao lado de `useFactory`. Interface `MikroOrmOptionsFactory`.

### Mongo

`data/mongo.md` funde `techniques/mongo.md` e a receita manual `DATABASE_CONNECTION` / `CAT_MODEL`. O fluxo é `MongooseModule.forRoot` / `forFeature` e `@InjectModel()`.

Seções novas: sessions com `connection.startSession()` via `@InjectConnection()`; `onConnectionCreate` em `forRoot` e `forRootAsync`; subdocuments (`Types.Subdocument`, `Types.DocumentArray`); `@Virtual()` de `@nestjs/mongoose`.

### Drizzle

`data/drizzle.md` (novo). `@nestjs/drizzle`, Drizzle v1 em `@rc` (`drizzle-orm@rc`, `drizzle-kit@rc`), driver `pg` no capítulo.

- `DrizzleModule.forRoot()` com `drizzle`, `connection` ou `db`, e `autoCloseConnection` (padrão `true`). Repassa `relations`, `logger`, `casing`.
- `@InjectDrizzle()` e `getDrizzleToken()`. Não há `forFeature()`: a tabela é um objeto importado.
- `defineRelations()` e `db.query`. `db.transaction()`. Migrations com `drizzle-kit generate` / `migrate`, ou `migrate()` no `forRootAsync()`.
- Vários bancos: `name` no `forRoot`, `@InjectDrizzle('analytics')`. `DrizzleOptionsFactory.createDrizzleOptions(name?)`.

### Cache

`data/caching.md`.

- Stores passam a ser Keyv: `stores` é um array (a primeira é a padrão, as outras são fallback). Redis via `@keyv/redis` e `createKeyv()`. Memória via `KeyvCacheableMemory`. Sai `cache-manager-redis-store`.
- TTL só em milissegundos (`ttl: 5000`, `@CacheTTL(5000)`). Some a nota de cache-manager v4 em segundos.
- `get()` devolve `undefined` no miss. `clear()` substitui `reset()`. A opção `max` sai do exemplo de `register()`.
- `Cache` e `CACHE_MANAGER` são importados de `@nestjs/cache-manager`.
- `@CacheTTL()` no controller vale para os métodos, e o método vence o controller. Fora de HTTP, `@CacheTTL()` sem `@CacheKey()` não tem efeito. Store em memória devolve a mesma referência; Keyv serializa JSON.
- `registerAsync` ganha `extraProviders` e generic opcional nas opções da store.

---

## 9. Segurança

A pasta deixa de ser um tutorial JWT escrito à mão, com Passport e RBAC/CASL de exemplo. O núcleo passa a ser dois pacotes. A receita Passport continua existindo em `recipes/passport.md`.

### Autenticação

`security/authentication.md`, pacote `@nestjs/authentication`.

- `AuthenticationModule.forRoot()` / `forRootAsync()`. Guard global `AuthenticationGuard`: a rota nasce fechada. `@Public()` abre.
- `@Authenticate({ optional, mfa, verifiedEmail, providers })` exige MFA verificado, e-mail verificado, ou restringe o provider (só sessão, sem API key).
- `@CurrentUser()`, `@CurrentUser('id')`, `@CurrentSession()`. `AuthenticationContext` via AsyncLocalStorage, com `requireUser()` e `run()` fora de HTTP.
- Providers: `SessionCookieProvider` (cookie `__Host-sid`, anti-fixation), `JwtBearerProvider` (HS256, RS256, JWKS), `ApiKeyProvider` (prefixo, hash, realm).
- `PasswordHasher`: scrypt, `hash` / `verify` / `needsRehash`, NFKC, `password.logN`.
- `SignInService` (sessão, MFA pendente, `signOut`, `signOutEverywhere`, `rotateSession`, `completeMfa`). `SessionService` (`list`, `revoke`, `revokeAll`). `TokenService`: access JWT e refresh opaco, com rotação e detecção de reuso.
- E-mail: `EmailVerificationService`, `PasswordResetService`. Magic link: `MagicLinkService`. OIDC: `OidcService.start` / `finish`, presets `google()`, `github()`, `microsoft(tenant)`, PKCE, cookie `__Host-oidc_tx`.
- MFA: `MfaService` com TOTP, recovery codes e segredo em AES-256-GCM (`mfa.encryption`).
- `WsAuthenticator` no handshake. Seis contratos de store (sessão, refresh, MFA, magic link, estado OIDC, token de e-mail), com exemplos Drizzle e TypeORM. Testes em `@nestjs/authentication/testing`.
- `AuthenticationEvents`. Rate limit de sign-in com `ThrottlerModule`. `enableCsrfProtection()` alinhado a `session.trustedOrigins`.
- Sai deste capítulo o fluxo `UsersService` + `JwtService.signAsync` + `AuthGuard('jwt')` + `@nestjs/passport`.

### Autorização

`security/authorization.md`, pacote `@nestjs/authorization`.

- `AuthorizationModule.forRoot()` / `forRootAsync()`, com `getUser`, `policies` e `globalGuard`. O módulo de autenticação importa antes.
- `AuthorizationGuard` nega a rota que não declara política.
- `@Policy()` é uma classe injetável. O primeiro argumento do método é o user. `before(user, ability, args)` serve de bypass (admin).
- `@Can(Policy, 'ability')` e `@Can.Anyone()`. O terceiro argumento lê params, por exemplo `customerId`.
- `AuthorizationService.can()` devolve boolean. `authorize()` lança `AuthorizationError`. Evento `nestjs:authorization:denied`.
- 401 é anônimo. 403 é autenticado sem permissão. `@Public()` equivale, do lado da autorização, a `@Can.Anyone()`.
- Saem o RBAC com `@Roles()` e `RolesGuard`, a seção de claims e o exemplo CASL (`CaslAbilityFactory`, `PoliciesGuard`, `@CheckPolicies()`).

### CSRF, headers, senha, rate limit e CORS

- `security/csrf.md`: `app.enableCsrfProtection()` no Nest 12.1, sem pacote. Olha `Sec-Fetch-Site` e, no fallback, `Origin` / `Host`. Opções `trustedOrigins`, `exclude` ou uma função. Rejeição é `ForbiddenException` 403, antes de middleware e guards. O caminho por token fica secundário: `csrf-csrf` no Express (no lugar do `csurf`) e `@fastify/csrf-protection`.
- `security/helmet.md`: o título vira “Security headers”. `app.useSecurityHeaders()` no 12.1, com os defaults do Helmet 8, no Express e no Fastify. Tabela de CSP, HSTS, COOP, CORP e opções tipadas. Guias de CSP para Swagger UI e GraphiQL. `helmet` e `@fastify/helmet` continuam utilizáveis direto.
- `security/encryption-hashing.md`: o exemplo principal deixa de ser bcrypt e passa a ser `PasswordHasher`. AES com `node:crypto` continua. argon2 e bcrypt ficam como alternativa fora do pacote.
- `security/rate-limiting.md`: Throttler v5. Config em `throttlers: [{ name, ttl em milissegundos, limit, blockDuration }]`. `@Throttle({ default: { limit, ttl } })` e `@SkipThrottle({ default: true })` substituem `@Throttle(3, 60)`. Opções `skipIf`, `getTracker` (async), `generateKey`, `setHeaders`, `ipv6SubnetPrefix`, `errorMessage`, `storage`. Helpers `seconds`, `minutes`, `hours`, `days`, `weeks`. `trust proxy` documentado no Express, no Fastify e no `NodeAdapter`, com o aviso do Fastify 5.12.1 (número significa não confiar em proxy nenhum).
- `security/cors.md`: `enableCors()` já existia. A doc passa a separar os defaults. Fastify, sem config, só libera `GET`, `HEAD` e `POST`. Origem `*` e o risco ficam explícitos.

---

## 10. GraphQL

- `graphql/quick-start.md`: o install de Express inclui `@as-integrations/express5`. `@nestjs/apollo` v14 exige Apollo Server v5. `playground` vira alias deprecated de `graphiql`. Subscriptions só com `graphql-ws`. Seção nova de `context: ({ req, res })`. `registerIn` para vários schemas code-first. `enumsAsTypes` no definitions factory. Sai o capítulo longo só de GraphQL Playground.
- `graphql/subscriptions.md`: saem `installSubscriptionHandlers` e o transporte `subscriptions-transport-ws` (removido no v14 de `@nestjs/graphql`). Entram `graphql-ws`, `pubSub.asyncIterableIterator`, `unclaimedUpgradeTimeout` e `WebSocketServer` com `noServer: true`. Mercurius usa `PubSub#subscribe`.
- `graphql/federation.md`: subgraph pode ter subscription com `ApolloFederationDriver` ou `MercuriusFederationDriver` e `subscription: true`. `ApolloGatewayDriver` continua sem. Federation 2 com `extend schema @link(...)` e `@Directive('@inaccessible')`. O install fica em `@apollo/subgraph` (sai `@apollo/federation`). `federationMetadata: true` sai dos exemplos Mercurius. Entra `@mercuriusjs/gateway`.
- `graphql/resolvers-map.md`: `@ObjectType({ registerIn: () => AuthorsModule })`. `number` sem type function vira `Float`. Argumento GraphQL e TypeScript tratam nullable de formas diferentes.
- `graphql/plugins.md`: o exemplo troca o operation registry por `ApolloServerPluginCacheControl`. Seção de plugins do Mercurius (`plugins: [{ plugin, options }]`).
- `graphql/complexity.md`: o tipo do plugin passa a vir de `@apollo/server`, não de `apollo-server-plugin-base`. A ordem documentada dos estimators fica `fieldExtensionsEstimator` e depois `simpleEstimator`.
- `graphql/cli-plugin.md`: `esmCompatible` e `debug` em `PluginOptions`. `typeFileNameSuffix` aceita `string | string[]`. Metadata importada como `./metadata.js`.
- `graphql/mapped-types.md`: `PartialType` com segundo argumento `omitDefaultValues` e `skipNullProperties` (padrão `true`). Seção para construir um type com `getFieldsAndDecoratorForType()`.
- `graphql/field-middleware.md`: middleware só se aplica a `ObjectType`. Retorno `undefined` cai no valor de `next()`.
- `graphql/extensions.md`: a condição do exemplo de role estava invertida e foi corrigida para `userRole !== extensions.role`.
- `graphql/mutations.md`: o SDL do upvote passa a devolver `Post!`. Seção para consultar o tipo `Query` raiz depois da mutation.
- `graphql/schema-generator.md`: `printSubgraphSchema` de `@apollo/subgraph` para o SDL do subgraph.
- `graphql/sharing-models.md`: o pacote exporta condição `browser` para o shim em bundler web. Alias de webpack vira fallback.
- `graphql/directives.md`, `guards-interceptors.md`, `interfaces.md`, `scalars.md` e `unions-and-enums.md`: sintaxe e redação (`@Query(() =>`, `@Scalar('Date', () => Date)`, `as const` em `createUnionType`). Sem API nova.
- `graphql/migration.md`: removido. Era o guia v9→v10 e v10→v11.

---

## 11. OpenAPI

- `openapi/introduction.md`: o padrão passa a ser `documentFactory = () => SwaggerModule.createDocument(...)` entregue a `SwaggerModule.setup()`. `enableVersioning()` tem de rodar antes de um `createDocument()` eager. Opções novas de `SwaggerDocumentOptions`: `autoTagControllers`, `onlyIncludeDecoratedEndpoints`, `excludeDynamicDefaults`, `exampleMaxDepth`, `linkNameFactory`, `standardSchemaConverter` (Zod 4.2+ com JSON Schema nativo, Valibot, zod-openapi). `SwaggerCustomOptions` ganha `ui`, `raw`, `jsonDocumentUrl`, `patchDocumentOnRequest`. Fastify precisa de `@fastify/static`. Alerta: guards não protegem o UI nem o JSON; condicione o `setup()` ao ambiente.
- `openapi/cli-plugin.md`: no `@nestjs/swagger` v12, JSDoc `@param` vira `@ApiQuery` ou `@ApiParam`. O default de `controllerKeyOfComment` muda de `'description'` para `'summary'`. Flags `classTransformerShim`, `skipAutoHttpCode`, `skipDefaultValues`, `autoFillEnumName`, `esmCompatible`. O plugin documenta, mas `class-validator` continua obrigatório em runtime. `await SwaggerModule.loadPluginMetadata(metadata)`.
- `openapi/operations.md`: tag hierárquica (`parent`, `kind` em `addTag()`) exige `setOpenAPIVersion('3.2.0')`. `addGlobalResponse` no `DocumentBuilder`. `@ApiExtension` lança se o nome não começa com `x-`.
- `openapi/other-features.md`: `addGlobalParameters`. Várias specs com `documentFactory`. Explorer com `explorer: true` e `swaggerOptions.urls`.
- `openapi/decorators.md`: a tabela passa a listar `@ApiIncludeEndpoint()`, `@ApiLink()`, `@ApiSchema()`, `@ApiCallbacks()`, `@ApiWebhook()`, `@ApiDefaultGetter()`, `@ApiHeaders()`.
- `openapi/types-and-parameters.md`: `@Headers()` entra na varredura do `SwaggerModule`. `@ApiSchema({ name, description })`. `example` / `examples` em propriedade. `enumName` em `@ApiQuery` e `@ApiParam`.
- `openapi/mapped-types.md` e `openapi/security.md`: redação (`IntersectionType` com dois ou mais tipos; `@ApiBasicAuth` / `@ApiBearerAuth`).
- `openapi/migration-guide.md`: removido. Era a renomeação Swagger 3→4 (`@ApiModelProperty` → `@ApiProperty`, `@ApiImplicit*` → `@ApiParam` / `@ApiQuery` / `@ApiBody`).

---

## 12. WebSockets

- `websockets/adapter.md`: `WsAdapter` ganha `messageParser`, `unclaimedUpgradeTimeout`, `gracefulShutdown` / `gracePeriod`, `maxConcurrentMessages`, `maxPayload` e `maxSendBufferSize`. O default de `maxPayload` documentado é 1 MiB; a doc cita 100 MiB antes do 12.5. `namespace` no `WsAdapter` lança. `IoAdapter` desconecta se a mensagem reutilizar `Buffer` ou `Blob`.
- `websockets/gateways.md`: `@Ack()` para acknowledgment manual do socket.io. Só `null` e `undefined` suprimem a resposta; `false` e `0` respondem. Na v12 o gateway pode ser request-scoped por conexão, e `REQUEST` é o `Socket`. `@WebSocketServer()` injeta `Namespace` quando há `namespace`. Emissão pelo socket não passa em interceptor. `handleConnection` async não funciona como gate.
- `websockets/pipes.md`: só `WsException` leva a mensagem ao cliente. `ValidationPipe` precisa de `exceptionFactory` que devolva `WsException`. `@MessageBody({ schema })` com `StandardSchemaValidationPipe`. Pipe global aplica ao gateway. Pipe vale em todos os parâmetros do handler.
- `websockets/exception-filters.md`: a mensagem `exception` pode incluir `cause`. `BaseWsExceptionFilter` aceita `includeCause` e `causeFactory`. `APP_FILTER` não se aplica a gateway. O adapter `ws` documenta o formato JSON.
- `websockets/guards.md`: guard que retorna `false` vira `WsException` com `'Forbidden resource'`. `APP_GUARD` se aplica a gateway.
- `websockets/interceptors.md`: explicita `app.useGlobalInterceptors()` e `APP_INTERCEPTOR`.

---

## 13. Microsserviços

### Comum a todos (`basics.md` e capítulos curtos)

- Metadata: `setOnDispatchHook()` preenche `packet.metadata`. No receptor, `getMetadata()`. MQTT 3 não carrega metadata. NATS, Kafka, RabbitMQ, MQTT 5 e gRPC usam headers.
- `ClientProxy` e o server documentam `status`, `on()` e `unwrap()` de forma parecida em TCP, Redis, NATS, MQTT, RabbitMQ e Kafka.
- `RequestContext` ganha `context`, `getData()`, `getPattern()` e `getContext()`.
- Limites de pattern: 5 níveis, 20 chaves, 256 caracteres na chave. JSON acima de 1 MiB é tratado como string.
- App híbrida: guard, pipe, interceptor e exception filter globais do HTTP não entram no microservice sem `inheritAppConfig`. `useGlobal*` se chama antes de `connectMicroservice`. Se os hooks precisam terminar antes, `listen` / `init` vêm antes de `startAllMicroservices`.
- `retryAttempts` / `retryDelay`, onde aparecem, passam a ser retry de conexão ou de listen, não de mensagem.

### Por transporte

**TCP** (`basics.md`). Opções `serializer`, `deserializer`, `socketClass`, `tlsOptions`, limites de buffer e timeout, `gracefulShutdown` / `gracePeriod`. No 12.5, `host` vazio equivale a `'localhost'` (em container, usar `'0.0.0.0'` ou `'::'`). `maxBufferSize` padrão cai de 128 MiB para 16 MiB. Seção de interoperabilidade com servidor que não é Nest: pacote `length#json`, `JsonSocket`, `isDisposed`, e `send()` sem timeout. Também `AsyncMicroserviceOptions` e TLS.

**NATS** (`nats.md`). Breaking: o pacote deixa de ser `nats` e passa a ser `@nats-io/transport-node` (NATS v3), com tipos de `@nats-io/nats-core`. Sem `StringCodec` / `JSONCodec`. O pacote é JSON. Deserializer custom recebe a mensagem inteira e usa `msg.json()`. Headers com `headers?.get('x-version')`. No 12.1.3 o handler pode devolver `NatsRecordBuilder`. `unwrap()` devolve `NatsConnection`. Eventos `disconnect`, `reconnect`, `update`.

**Kafka** (`kafka.md`). O client documentado passa a se chamar `ClientKafkaProxy`. `@MessagePattern` aceita `RegExp` (`lastIndex` é resetado nas flags `g` e `y`). Parser: `keepBinary` e `maxMessageSize` (padrão 16 MiB). Mensagem sem os headers Nest `kafka_correlationId` e `kafka_replyTopic` é evento, não request. Limite de 256 caracteres no correlation id e de 10.000 headers. `commitOffsets` documenta o offset como `Number(offset) + 1`, via `context.getConsumer()`. Filtro `KafkaMaxRetryExceptionFilter`. `postfixId` tem defaults `-server` e `-client`. Acesso a `client.producer` e `client.consumer`. Status `KafkaStatus`.

**RabbitMQ** (`rabbitmq.md`). Opções novas: `consumerTag`, `replyQueue`, `persistent`, `noAssert`, `wildcards`, `exchange`, `routingKey`, `maxConnectionAttempts`, `maxMessageSize`, `gracefulShutdown`, `gracePeriod`. `noAck` padrão `true` fica explícito. `urls` é uma lista tentada em ordem. Seção de wildcard com topic exchange (`cats.#`); a routing key tem limite de 255 bytes. No 12.1.3 a reply pode ser um `RmqRecordBuilder`. `headers` existe no producer. `unwrap()` devolve `AmqpConnectionManager`. `on()` a partir do 12.1.2 mantém o listener até `close()`. Status `RmqStatus`.

**Redis** (`redis.md`). `maxWildcardChannelLength` (padrão 1024), `wildcards: true` com pattern `notifications.*`, `gracefulShutdown`, `gracePeriod`. `retryDelay` padrão 5000 ms, e é retry de conexão. `host` é hostname, não URL. `unwrap()` devolve a tupla `[pub, sub]` do ioredis. `on('error', (client, err))` distingue `'pub'` e `'sub'`. Listeners a partir do 12.1 sobrevivem ao reconnect. Status `RedisStatus`.

**MQTT** (`mqtt.md`). QoS 0 é o default dos decorators. QoS global em `subscribeOptions.qos`. QoS por pattern em `@EventPattern('...', { qos: 2 })`. Opções `userProperties`, `maxConnectionAttempts` (só na conexão inicial), `gracefulShutdown`, `gracePeriod`. No 12.1.3 a reply pode ser `MqttRecordBuilder`. `unwrap()` devolve `MqttClient`. Status `MqttStatus`. A URL de exemplo corrige a porta `1833` para `1883`.

**gRPC** (`grpc.md`). `package` e `protoPath` aceitam array. `protoPath` pode faltar se houver `packageDefinition`. `url` de exemplo em Docker: `0.0.0.0:50051`. Credenciais inseguras são o default, também no client. Servidor ganha `maxPendingResponses`, `gracefulShutdown` e `gracePeriod` (stream sem fim segura o shutdown até o `gracePeriod`). `GrpcExceptionFilter` e exceções `Grpc*Exception` (v12). `RpcException` com `code` / `status` mapeia o status gRPC. Imports de `Metadata` e `ServerUnaryCall` vêm de `@grpc/grpc-js`. A opção do loader é `keepCase`. Seções novas: reflection (`@grpc/reflection`, `onLoadPackageDefinition`) e health check (`grpc-health-check`). RPC de stream não usa `@GrpcMethod()`; usa `@GrpcStreamMethod()` ou `@GrpcStreamCall()`.

**Custom** (`custom-transport.md`). A interface do server também exige `on()` e `unwrap()`, que podem lançar “not implemented”. `publish()` devolve `() => void`. O callback de exemplo inclui `isDisposed: true`. `propagatesEventHandlerErrors: true` quando a lib (Kafka, por exemplo) já reporta o erro do event handler. A classe do exemplo passa a ser `ClientTCP`. `ClientsModule.register` recebe um array.

### Hooks, pipes, guards e filtros

- `microservices/pre-request-hooks.md` (novo): `registerPreRequestHook()` roda antes de guard, interceptor e pipe. Precisa chamar `next()` e devolver `Observable`. Só pode ser registrado antes de `listen()` ou `init()`. Tipo `PreRequestHook` em `@nestjs/common`. Não vale para WebSocket. Em app híbrida, `connectMicroservice()` sobe na hora; sem `deferInitialization: true` o hook registrado depois é ignorado.
- `microservices/pipes.md`: `ValidationPipe` com `exceptionFactory` que devolve `RpcException`. `@Payload({ schema })` com `StandardSchemaValidationPipe`. `HttpException` no handler vira “Internal server error” no client se não houver filter.
- `microservices/guards.md`: guard que retorna `false` vira `RpcException` com o texto `'Forbidden resource'`.
- `microservices/exception-filters.md`: `RpcException` com objeto devolve o objeto como está. Event handler sem stream: um filter que relança não alcança o produtor. A classe base nomeada é `BaseRpcExceptionFilter`.
- `microservices/interceptors.md`: só o hint de `inheritAppConfig`.

O FAQ `hybrid-application.md` repete a ordem `listen`/`init` antes de `startAllMicroservices`, `@MessagePattern` com `transportId` em transporte custom, e `inheritAppConfig` incluindo os tokens `APP_*`.

---

## 14. AI

Capítulo novo. Pacote `@nestjs/ai`. Exige Node 22 e o AI SDK `ai` na versão 7.

- `ai/overview.md`: `AiModule.forRoot()` / `forRootAsync()` com `models`, `embeddingModels`, `defaults`, `embeddingDefaults`, `onUsage`, `onEmbeddingUsage`, `include`, `modelNames`. Cada modelo tem `model`, `fallback`, `pricing`, `timeout`, `retry`, `resilience`. `AiService.generateText()`, `generateObject()`, `streamText()`. `@InjectModel()`. Erros `AiConfigurationError` e `AiOutputError`. `createOpenAICompatible()` de `@ai-sdk/openai-compatible` para provedores compatíveis. `AiOptionsFactory.createAiOptions()`.
- `ai/models.md`: a configuração vale nesta ordem: a chamada, o modelo, `defaults`. `@InjectModel('nome')` sem passar pelo `AiService` não aplica as políticas. `AiModels.names()`, `has()`, `get()`. Políticas de `@nestjs/resilience` (`timeout`, `retry`, `fallback`). Erros `AiModelError`, `AiBudgetExceededError`, `AiToolError`. `budget` com `maxTokens` e `maxCost`. `onUsage` traz `usage`, `cost`, `label`, `model`, `step`, `fallback`, `stream`.
- `ai/embeddings.md`: `AiService.embed()` e `embedMany()`. `@InjectEmbeddingModel()` e `AiEmbeddingModels`. `onEmbeddingUsage`. `maxParallelCalls` no `embedMany()`. Embedding não faz fallback entre modelos. `FakeEmbeddingModel` para teste.
- `ai/tools.md`: `@AgentFunction({ name, description, inputSchema, scopes })` em método de provider (`include` do módulo). `AgentFunctionContext`: `request`, `user`, `scopes`, `toolCallId`, `idempotencyKey`, `messages`, `signal`, `reportProgress()`. `caller` na chamada do `AiService`. `AiTools.select()` expõe as functions ao AI SDK direto. O mesmo método pode ter `@Tool()` (MCP) e `@AgentFunction()`. Contexto `'ai'` conversa com `@nestjs/authentication` e `@nestjs/authorization`; a doc cita versões mínimas 0.1.4 e 0.1.2.
- `ai/agents.md`: loop até `maxSteps` (padrão 10). `finishReason: 'tool-calls'` quando estoura. Conversa com `messages` e `responseMessages`. `streamText()` com `pipeUIMessageStreamToResponse()`, `pipeTextStreamToResponse()`, `toUIMessageStream()`, `abort()`, `keepAlive`, `errorText`. Progresso no browser como `data-tool-progress`. Runs duráveis em `@nestjs/ai/workflows`: `AiAgents.run()` com `approve`, `approvalTimeout`, `stepsPerInstance`, `budget`. `pendingApprovals()`, `approve()`, `reject()`. `WorkflowClient.start()` com id fixo para deduplicar.
- `ai/testing.md`: `@nestjs/ai/testing` com `FakeModel`, `fakeModel()`, `reply()`, `providerError()`, `overrideModels()`, `overrideEmbeddingModels()`, `callTool()`. Workflow de teste com `ManualWorkflowClock` e `WorkflowWorker.drain()`.

---

## 15. MCP

Capítulo novo. Pacote `@nestjs/mcp`.

- `mcp/overview.md`: servidor a partir de métodos de provider. `McpModule.forRoot()` / `forRootAsync()` com `name`, `version`, `instructions`, `include`, `path`, `auth`, `http`, `stdio`, `decorators`, `endpointVersion`. HTTP stateless, default em `/mcp`. Descoberta de `@Tool()`, `@Resource()`, `@ResourceTemplate()`, `@Prompt()` no bootstrap.
- `mcp/primitives.md`: `@Tool()` com `inputSchema`, `outputSchema` e `annotations` (`readOnlyHint`). `@Resource()` e `@ResourceTemplate()` com URI e template RFC 6570. `@Prompt()` com `argsSchema`. `McpContext`: `authInfo`, `request`, `transport`, `era`, `signal`, `reportProgress()`, `server`. `McpExecutionContext` do tipo `'mcp'`, com guard, interceptor e pipe no mesmo modelo das rotas HTTP. Auth: `McpTokenVerifier.verifyAccessToken`, resource server OAuth 2.1, metadados RFC 9728. `JwtVerifier` de `@nestjs/authentication`. `inputRequired()` e `acceptedContent()` para o cliente pedir dado ao usuário.
- `mcp/transports.md`: HTTP com `http.legacy`, `http.responseMode`, `allowedOrigins`, `allowedHosts`, `maxRequestBodySize`, respeitando prefixo global, versionamento e CORS. Stdio com `McpStdioServer` e `McpStdioLogger`. `path: false` deixa só o stdio. O entry point de stdio usa `NestFactory.createApplicationContext()`, separado do `main.ts`.
- `mcp/testing.md`: `connectMcpClient()` de `@nestjs/mcp/testing` atravessa o mesmo pipeline HTTP. Cliente oficial `@modelcontextprotocol/client`: `listTools`, `callTool`, `readResource`, `getPrompt`.
- `mcp/migration.md`: de `@rekog/mcp-nest` para `@nestjs/mcp`. `parameters` vira `inputSchema`. Contexto único `McpContext`. Sem `@McpController()` e sem strategy de microservice. Stdio via `McpStdioServer`.

---

## 16. Observabilidade

Capítulo novo. Pacote `@nestjs/observe`. O core citado é `@nestjs/core` ≥ 11.1.4. `npx @nestjs/observe link` cria o projeto, as chaves e instala o SDK.

- `observability/overview.md`: instrumentação por `instrument` em `NestFactory.create()`. Cobre HTTP, GraphQL, gRPC, microservices, jobs e um span por classe/método.
- `observability/sdk.md`: `createObserveModule()` devolve `ObserveModule` e `ObserveInstrument`. Opções `traceIdGenerator`, `sourceContext`, `attachTraceIdToLogs`, `skipInstrumentation`. `ObserveModule.forRoot()` / `forRootAsync()` com `appKey`, `appSecret`, `serviceId`, `enabled`, chaves `http` / `rpc` / `grpc` / `graphql` / `jobs`, `outgoing`, `openTelemetry`, `otlp`, `forwardLogs` e SLOs (`Objective`). `TracerService` para span manual, métrica e correlação de log. Instrumentação citada para LLM, banco e Bull/BullMQ. Propagação por `x-request-id` e `traceparent`.
- `observability/manual-instrumentation.md`: `TracerService.createSpan()`, tags e métricas.
- `observability/distributed-tracing.md`: propagação em HTTP, fila, microservice e gRPC (metadata `x-request-id` / W3C). Versões mínimas de `@nestjs/microservices` são citadas para a propagação automática.
- `observability/error-monitoring.md`: erro de controller, resolver e job é capturado sem um filter extra, e convive com os filters que a app já tem.
- `observability/opentelemetry.md`: opção `openTelemetry` e `otlp`. Coexistência com o SDK OTEL. Limitação no Nest 12 com `@opentelemetry/instrumentation-nestjs-core`.
- `observability/dashboard.md`: vistas Requests, Services, Errors, Jobs, Traces, Releases e Rules. Não há API npm além do SDK.
- `observability/choosing-an-apm.md`: compara Observe, OpenTelemetry, Sentry, Datadog, New Relic e Elastic. A diferença que o texto marca é o hook `instrument` contra o preload de agente.
- `observability/production-rules.md`: regras sobre o trace (contagem de spans, HTTP de saída, chamadas de LLM), configuradas no dashboard.
- `observability/mcp-server.md`: servidor MCP hospedado em `https://observe-api.nestjs.com/mcp`, em plano pago, para um cliente MCP consultar a telemetria do projeto via OAuth.

O mesmo produto aparece em outros capítulos: `first-steps.md` (flag do scaffold), `controllers.md` (rotas em produção), `application/logger.md` (`traceId` no log), `recipes/async-local-storage.md` (`TracerService` no lugar do middleware manual) e `deployment.md`.

---

## 17. Confiabilidade

### Resilience, idempotência, outbox, locks e workflows

Capítulos novos.

- `reliability/resilience.md`: `@nestjs/resilience`. `ResilienceModule.forRoot()` com `presets` e `defaults`, mais um interceptor global. Decorators `@Resilience(preset)`, `@Retry()`, `@Timeout()`, `@CircuitBreaker()`, `@Bulkhead()`, `@Fallback()`, `@Signal()` (o `AbortSignal` da tentativa). `ResilienceService` para código que não é entrypoint. `ResilienceEvents` no canal `nestjs:resilience:<type>`. Timeout vira HTTP 504. Breaker aberto vira 503 com `Retry-After`. Importar `IdempotencyModule` antes de `ResilienceModule`.
- `reliability/idempotency.md`: `@nestjs/idempotency`. `@Idempotent()` em HTTP, em argumento GraphQL `idempotencyKey` e em RPC. Opções `required`, `ttl`, `lockTtl`, `fingerprint`, `keyFrom`, `storeIf`. Contratos `IdempotencyStorage` e `IdempotencyStore` (Drizzle, TypeORM, Redis, implementados pela app). Eventos `nestjs:idempotency:*`. Teste `idempotencyStoreContract()` em `@nestjs/idempotency/testing`. Erros `IDEMPOTENCY_KEY_REQUIRED`, `IDEMPOTENCY_KEY_IN_USE`, `IDEMPOTENCY_KEY_REUSED`.
- `reliability/outbox.md`: `@nestjs/outbox`. `Outbox.add()` na mesma transação dos dados. `PostgresOutboxStore` e `MySqlOutboxStore`, com executors `fromDrizzle`, `fromTypeOrm`, `fromPrisma`, `fromKysely`, `fromPg`. CLI `npx @nestjs/outbox migrate|status|sql`. Relay, dead-letter e inbox por consumidor. Schema `nest_outbox`. Erros `OutboxSchemaError` e `OutboxTransactionRequiredError`.
- `reliability/locks.md`: `@nestjs/locks`. `LocksModule.forRoot()` e store via `LockStore` / `LocksStorage`. `@OnOneInstance()` para um cron ou job por cluster. `@WithoutOverlapping()` na mesma chave. Lease com `AbortSignal` e fencing token. `lockStoreContract()` em `@nestjs/locks/testing`. Integra com `@Cron`, `@Interval` e `@Timeout`.
- `reliability/workflows.md`: `@nestjs/workflows`. Classe com `@Workflow()` e método `run()`. Steps com journal. `WorkflowClient.start()`, `getStatus()` e signals. `WorkflowRunner`, `WorkflowContext`, `WorkflowStepContext` (step, sleep, wait, compensação). `WorkflowSignal`, `NonRetryableStepError`, `WorkflowResultTimeoutError`. Stores `PostgresWorkflowStore` e `MySqlWorkflowStore`. CLI `npx @nestjs/workflows migrate|status|sql`. Ponte CQRS em `@nestjs/workflows/cqrs`: `WorkflowsCqrsModule`, `@StartOn`, `@SignalOn`. `AesGcmPayloadCodec`. Teste com `ManualWorkflowClock` e `WorkflowWorker`.

### Health checks

`reliability/terminus.md` veio de `recipes/terminus.md`. O título passa a ser “Health checks”.

- Rotas separadas `/live` e `/ready`, com a orientação de Kubernetes.
- `FetchHealthIndicator` substitui `HttpHealthIndicator`. Este fica deprecated; o exemplo antigo pedia `@nestjs/axios`.
- Status `'degraded'` em `HealthCheckResult`, com HTTP 200.
- `HealthIndicatorService.attempt()` para indicador custom (o exemplo é uma fila BullMQ), no lugar de só estender `HealthIndicator`.
- `withTimeout()` nos checks. O timeout embutido dos checks antigos fica deprecated. Threshold de disco no formato `'250gb'`.
- A tabela de indicadores inclui `PrismaHealthIndicator`, `GRPCHealthIndicator` e MikroORM. TypeORM usa `InjectDataSource`, não `InjectConnection`.
- `@HealthCheck()` documenta 200 e 503 no Swagger, com schema `TerminusHealthCheckResult`.
- O pacote é publicado como ESM. Peers de ORM são carregados de forma dinâmica.

O `migration.md` repete a troca: saem `HealthIndicator` e `HealthCheckError`; entram `HealthIndicatorService.up()`, `down()` e `attempt()`.

---

## 18. Migração e deploy

`migration.md` foi reescrito. O guia v9→v10 (CacheModule, TypeScript 4.8, fim do Node 12, target ES2021) sai. O arquivo passa a ser o guia **11 → 12**, e manda quem está abaixo da 11 para `/faq/versions`. A ferramenta recomendada é `nest upgrade`, no lugar do `ncu` manual.

Os itens que esse arquivo lista, e que os capítulos correspondentes detalham, são: Node em duas faixas (runtime da app e geradores), pacotes ESM-only, Standard Schema em rota e em serialização, GraphiQL e `graphql-ws`, NATS v3, ordem dos lifecycle hooks, `@Optional()` em subclasse, `@nestjs/config` com Joi 18, Terminus v12, webpack deprecated, schematic `angular` removido, `routeConflictPolicy`, `errorCode`, `structuredParams` do logger, `@nestjs/observe`, `ValidationPipe.errorFormat`, filtro de exceção gRPC, `RegExp` no Kafka, gateway WebSocket request-scoped, pre-request hook, graceful shutdown do Express e o mapeamento de erro dos adapters HTTP. A segunda metade do arquivo é o passo a passo opcional de ESM (`"type": "module"`, `moduleResolution` nodenext, import `.js`, `import.meta.dirname`, sem `require()`).

### Vindo de outro framework

Capítulos novos em `migrating/`.

- `express.md`: Express 5. Caminho incremental com `ExpressAdapter(createLegacyApp())` por cima do app que já existe. Tirar o 404 catch-all do Express. Mapa de middleware para guard e pipe.
- `fastify.md`: Fastify 5. `FastifyAdapter(await buildLegacyApp())`. `setErrorHandler` vai para um plugin encapsulado. Tirar `setNotFoundHandler`. `@RouteSchema` para JSON Schema. Rota duplicada falha no startup.
- `spring-boot.md`: tabela de beans, scopes, segurança, data, Actuator e Kafka. Módulos explícitos no lugar de component scan. Token com classe abstrata. Dynamic modules.
- `aspnet-core.md`: `Program.cs` / `WebApplication` para `main.ts` e módulos. Lifetimes para scopes. Minimal API para `nest new --minimal`. Filters para guards e interceptors. Identity para os pacotes de auth. Keyed services para custom providers.

### Deploy

`deployment.md` (novo): Node 20.19+ ou 22.12+, `nest build`, `NODE_ENV=production`, `node dist/main.js`, health com Terminus, log, Observe com `instrument`, escala vertical e horizontal, Docker, e `nest deploy` / `mau deploy` (`@nestjs/mau`). Uma tabela cruza o que o Mau cobre com o resto do capítulo.

---

## 19. FAQ

### Alterados

- `faq/errors.md`: a mensagem de DI cita o módulo, não só o “context”. Provider colocado em `imports` tem erro próprio. Token `undefined` ou `Object` por causa de `import type`.
- `faq/global-prefix.md`: `*` do `path-to-regexp` fica deprecated; o texto manda usar `:param` ou `*splat`. Seção sobre rota excluída que não casa (404 do Express e do Fastify) e sobre exclude com versionamento por URI.
- `faq/http-adapter.md`: o adapter pode ser `NodeAdapter`. `HttpAdapterHost` ganha `listen$` e a propriedade `listening`.
- `faq/hybrid-application.md`: ver a seção de microsserviços. A porta do exemplo TCP muda de 3001 para 3002.
- `faq/multiple-servers.md`: `OnApplicationShutdown` para fechar o HTTP/HTTPS que a app criou à mão. `app.close()` não fecha esses servidores.
- `faq/request-lifecycle.md`: middleware de módulo `@Global()` e a ordem pelo grafo de imports. Guard global via `APP_GUARD`. Exceção de middleware só em filter global. A lista numerada foi reestruturada.
- `faq/serverless.md`: runtime de exemplo `nodejs22.x`. `@codegenie/serverless-express` com `configure()` substitui `@vendia/serverless-express`. Swagger em `/swagger/` para evitar loop de redirect. CLI 12.0.8+ com `output.library.type: commonjs2` no build serverless. Import dinâmico com sufixo `.js`.
- `faq/raw-body.md`: os exemplos passam a ser ESM. Sem API nova.

### Novos

- `faq/versions.md`: tabela Nest 8–12, Node e RxJS. Links para a doc arquivada de cada versão. `nest upgrade` só cobre 11→12. Saltos anteriores usam `npm i @nestjs/*@N` e `nest info`.
- `faq/keep-alive-connections.md`: `forceCloseConnections` em `NestFactory.create()`. No Fastify, a partir do 12.1, essa opção fica na aplicação, não mais no `FastifyAdapter`.
- `faq/cloudflare-workers.md`: tabela de quando usar Worker e quando usar Nest. Proxy do Worker para a origem é o caminho documentado. Rodar Nest dentro do Worker não é oficial: `@Inject()` obrigatório, sem WebSocket gateway, sem shutdown hooks e sem microserviço TCP.
- `faq/nest-vs-fastify-express-hono.md`: guia de escolha, tabela de recursos, `nest new --minimal` e benchmark com `wrk` no `NodeAdapter`. Aponta para os capítulos `migrating/express` e `migrating/fastify`.

`discover/who-uses.json` só troca a lista de logos. `discover/who-uses.md`, `enterprise.md` e `support.md` são redação.

---

## 20. Receitas

### Alteradas

- `recipes/cqrs.md`: `CqrsModule.forRoot()` / `forRootAsync()` com tabela (`commandPublisher`, `rethrowUnhandled` e outras). `Command<T>` e `Query<T>` para o retorno de `CommandBus#execute` e `QueryBus#execute`. Seção própria de queries. Agregado de três jeitos: estender `AggregateRoot`, mixin `WithAggregateRoot()`, ou implementar `IAggregateRoot`. No `@nestjs/cqrs` 12.1, `commit()` e `publish()` devolvem o que o publisher devolve e aceitam `dispatcherContext` (uma transação, por exemplo). Sagas duráveis com `@nestjs/workflows`, `WorkflowsCqrsModule`, `@StartOn` / `@SignalOn` e store Postgres ou MySQL. Request scope com `Scope.REQUEST` no handler e `AsyncContext` no `execute()`, no `EventPublisher` e em `AsyncContext.merge` na saga. `UnhandledExceptionBus` e `UnhandledExceptionInfo`.
- `recipes/async-local-storage.md`: seção do `TracerService` (`setAttribute`, `getAttribute`, `currentTraceId`) para HTTP, GraphQL, microservices, BullMQ e cron, sem middleware manual. O exemplo manual passa a usar `forRoutes('*path')`. O import recomendado é `node:async_hooks`. `nestjs-cls` continua no capítulo.
- `recipes/swc.md`: `builder` no `nest-cli.json` pode ser objeto, com `swcrcPath` e `extensions` (`.tsx`, `.jsx`). O schema do `.swcrc` aponta para `https://swc.rs/schema.json`. SWC emite ESM ou CJS conforme `"type": "module"`. No monorepo v12 o Rspack já traz SWC; `swc-loader` com webpack só no builder deprecated. `generate-metadata.ts` usa `import.meta.dirname` e `apps/<name>/tsconfig.app.json`. `WrapperType<T>` para injeção circular, não só em entidade de ORM. Jest: `transform` como `["@swc/jest"]`, com `legacyDecorator` e `decoratorMetadata` no `.swcrc`. Vitest: `@vitest/coverage-v8`, alias `src`, `test:debug` com `--no-file-parallelism`.
- `recipes/hot-reload.md`: aviso de que webpack está deprecated no 12 e que monorepo usa Rspack. A receita fica para CommonJS com `module.hot`. `forceCloseConnections` e uma `closePromise` guardada em `module.hot.data` esperam o `app.close()` para não ficar com `EADDRINUSE`.
- `recipes/passport.md`: rota de logout com `req.logout()` assíncrono (Passport 0.6+). JWT stateless não usa isso. `validate()` pode devolver uma tupla; o segundo valor vira `req.authInfo`. `PassportModule.register()` repassa opções para `authenticate()`, além de `defaultStrategy` e `property`. Exemplo novo `GqlLocalAuthGuard`, que copia os args GraphQL para `req.body`. Os links de versionamento e SSE apontam para `/http/...`.
- `recipes/nest-commander.md`: teste com o pacote `nest-commander-testing` (`CommandTestFactory`). O site da lib passa a ser `nest-commander.jaymcdoniel.dev`.
- `recipes/crud-generator.md`: o gerador é explícito como só TypeScript. Em CI, `--no-interactive` usa os defaults `rest` e `--crud`. Flags `--type` e `--crud`.
- `recipes/repl.md`: `repl()` devolve Promise e aceita, no segundo argumento, as opções do REPL do Node. A tabela de funções nativas inclui `help`. `debug()` aceita um módulo para filtrar.
- `recipes/serve-static.md`: exemplo SPA com `import.meta.dirname` e `node:path`. No Fastify, `serveStaticOptions.fallthrough` para o fallback de `index.html` se parecer com o Express.
- `recipes/router-module.md`: o link de versionamento vai para `/http/versioning`. Sem API nova.

### Novas

- `recipes/nextjs.md`: monorepo npm workspaces, Next em `apps/web` e Nest em `apps/api`. Rewrite `fallback` de `/api` para o Nest, cookie sem CORS. Schemas Zod compartilhados num pacote `contracts`, validados com `StandardSchemaValidationPipe`. Sessão do `@nestjs/authentication` com `trustedOrigins`. Limites `proxyClientMaxBodySize` e `proxyTimeout`. `trust proxy` para o rate limit por IP.
- `recipes/supabase.md`: auth e RLS ficam no Supabase; segredo, webhook, job e admin API ficam no Nest. Pacotes: `@nestjs/config`, `@nestjs/authentication` com JWKS, `@supabase/supabase-js`, `@nestjs/drizzle`, `@nestjs/authorization`, `@nestjs/webhooks`, `@nestjs/outbox`, `@nestjs/schedule`, `@nestjs/locks`, `@nestjs/bullmq`. Chaves publishable/secret no lugar de `anon` / `service_role`. RLS obrigatório em `public`.
- `recipes/socket-activation.md`: systemd entrega o socket. A app lê `LISTEN_FDS` e escuta em `fd: 3`. `exitWhenIdle` encerra depois da ociosidade. Avisos sobre WebSocket, SSE, jobs e `Restart=on-failure`.

### Removidas

- `recipes/automock.md`: `@automock/jest`, `TestBed.create()`, mock automático por reflexão, tokens string.
- `recipes/documentation.md`: Compodoc (`npx @compodoc/compodoc -p tsconfig.json -s`).

Prisma, MikroORM, TypeORM, Sequelize, Mongo e Terminus saíram de `recipes/` e estão nas seções [Dados](#8-dados) e [Confiabilidade](#17-confiabilidade).

---

## 21. Tutoriais

Pasta nova, `content/tutorials/`. `overview.md` descreve a trilha e a stack: Zod, `platform-node`, `@nestjs/authentication`, Drizzle com PostgreSQL, Vitest contra Postgres.

| Arquivo | O que monta | Pacotes além da base JWT |
|---|---|---|
| `rest-api-jwt-authentication.md` | Notas, access e refresh, OpenAPI, health, log JSON, e2e. Cobre reuso de refresh, timing de login e corrida de escrita | `platform-node`, `config`, `drizzle`, `authentication`, `throttler`, `swagger`, `terminus` |
| `ecommerce-backend.md` | Catálogo, carrinho, checkout, cancelamento. Estoque que não vende a mais, com dez clientes no teste | `authorization` |
| `multi-tenant-saas.md` | Organizações, papéis, convite por e-mail, projeto por tenant, audit log. Toda query carrega o tenant. O último owner não pode sair | `authorization`, `mail`, DI por sub-árvore durável |
| `project-management-api.md` | Projetos, tarefas, comentários, SSE, lembrete de prazo. Permissão por registro e job em uma instância | `authorization`, `event-emitter`, `schedule`, `locks` |
| `realtime-chat.md` | Salas, histórico REST e evento ao vivo. Handshake autenticado e membership por mensagem | `websockets`, `platform-socket.io` |
| `booking-system.md` | Recurso, slot, cancelamento com cutoff. Zero double booking por constraint de exclusão no PostgreSQL | `authorization` |
| `background-jobs.md` | E-mail de boas-vindas e digest diário. Fila, outbox, job único e shutdown | `mail`, `bullmq`, `outbox`, `schedule`, `locks` |
| `file-uploads.md` | Upload e download, quota, link que expira. Validação em stream | `storage` |
| `payments-webhooks.md` | Pagamento no e-commerce por webhook assinado. Cada evento aplicado uma vez | `http-client`, `webhooks`, `outbox` |
| `ai-chat-backend.md` | Chat sobre as notas do usuário, com tools e streaming. A tool só vê dado daquele usuário. Abort ao desconectar. Teto de token | `ai`, SSE, `throttler`; `FakeModel` em dev e teste |

---

## 22. Pacotes que a v12 documenta

Pacotes `@nestjs/*` que têm capítulo ou seção própria na v12 e não eram o assunto da v10. Pacotes que já existiam e só mudaram de página (TypeORM, Mongoose, Sequelize, Terminus, throttler, schedule, event-emitter, config, swagger, microservices, cqrs, bull) ficam de fora desta lista.

| Pacote | Onde a doc trata |
|---|---|
| `@nestjs/platform-node` | `first-steps`, `http/performance`, tutoriais |
| `@nestjs/authentication` | `security/authentication`, receita Passport continua separada, tutoriais, MCP, AI |
| `@nestjs/authorization` | `security/authorization` |
| `@nestjs/http-client` | `application/http-client` (no lugar de `@nestjs/axios` como capítulo principal) |
| `@nestjs/storage` | `application/file-storage` |
| `@nestjs/i18n` | `application/i18n` |
| `@nestjs/mail` | `application/mail` |
| `@nestjs/webhooks` | `http/webhooks` |
| `@nestjs/drizzle` | `data/drizzle` |
| `@nestjs/bullmq` | `application/queues` (BullMQ na frente; `@nestjs/bull` fica como legado) |
| `@nestjs/ai` | `ai/*` |
| `@nestjs/mcp` | `mcp/*` |
| `@nestjs/observe` | `observability/*`, scaffold, logger, ALS |
| `@nestjs/resilience` | `reliability/resilience`, também nas políticas do `AiModule` |
| `@nestjs/idempotency` | `reliability/idempotency` |
| `@nestjs/outbox` | `reliability/outbox`, webhooks, tutoriais |
| `@nestjs/locks` | `reliability/locks`, schedule, tutoriais |
| `@nestjs/workflows` | `reliability/workflows`, CQRS, agentes de AI |
| `@nestjs/mau` | `deployment`, comando `nest deploy` |

Subpaths citados nos capítulos novos: `@nestjs/ai/testing`, `@nestjs/ai/workflows`, `@nestjs/authentication/testing`, `@nestjs/mcp/testing`, `@nestjs/idempotency/testing`, `@nestjs/locks/testing`, `@nestjs/outbox/postgres`, `@nestjs/outbox/mysql`, `@nestjs/workflows/cqrs`, `@nestjs/workflows/postgres`, `@nestjs/workflows/mysql`, `@nestjs/webhooks/postgres`, `@nestjs/webhooks/mysql`.
