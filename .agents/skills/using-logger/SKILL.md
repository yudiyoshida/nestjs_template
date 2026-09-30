---
name: using-logger
description: Adiciona observabilidade via ILoggerGateway, LogContext e payload tipado (debug vs error, sem segredo). Use quando o usuário pedir logger, log, observabilidade, LogContext, winston, arquivo em logs/, ou para rastrear falha/sucesso de adapter, filter HTTP ou outra fronteira do sistema.
---

# Using Logger

Observabilidade **nas fronteiras** do sistema: injetar `ILoggerGateway` (`TOKENS.LoggerGateway`) e gravar `debug`/`error` com `LogContext` tipado. Winston já existe; esta skill **não** recria o módulo de logger.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos para descobrir o padrão de log.**

Todo o padrão — quando logar, `debug` vs `error`, `LogContext`, payload, segredos, injeção — está aqui e apenas aqui.

Antes de escrever, **não**:

- leia adapters, filters ou `logger.gateway.ts` para copiar payload/estilo (exceto o passo 3, só para **inserir** contexto)
- rode grep/glob por `logger.debug`, `logger.error`, `LogContext.`
- copie `console.log`, `Logger` do Nest ou Winston direto

Se código existente contradiz esta skill, **esta skill vence**.

**Obrigatório editar** quando nascer um contexto novo (não para copiar formato):

- `src/infra/logger/logger.gateway.ts` — valor em `LogContext` **e** índice em `LogContextDataMap` **e** o `type` do payload, no mesmo diff

Winston (`LoggerWinstonAdapterGateway`) itera `Object.values(LogContext)`: contexto novo → arquivo `logs/<kebab>.log` sozinho. **Não** editar o adapter Winston só para contexto novo.

Exceção: usuário apontar um arquivo, ou pedir edição de um log que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que o ponto é fronteira observável (não entidade, não cada linha de use case)
- [ ] 2. Reusar LogContext existente se for o mesmo recorte (HTTP, CACHE, …)
- [ ] 3. Se recorte novo: enum + type + mapa em logger.gateway.ts
- [ ] 4. Injetar ILoggerGateway e chamar debug ou error com payload do mapa
- [ ] 5. Sanitizar: zero segredo no payload
- [ ] 6. Spec do consumidor: expect logger.debug/error via writing-unit-tests
- [ ] 7. Checklist de entrega
```

## Quando usar

Log existe para **entender o sistema depois**: falha de I/O, request que estourou, operação de cache. Não para narrar o domínio.

| Logar | Não logar |
|-------|-----------|
| `catch` de adapter real (vendor, rede, SDK) | Entidade, VO, factory de domínio |
| Filter HTTP ao responder `AppException` | Controller / use case no happy path (auditoria = interceptor futuro, outra tarefa) |
| Sucesso de I/O **útil para rastrear** (cache `set`/`delete`) | Fake adapter (no-op; teste não precisa de log interno do fake) |
| Identificador da operação (chave, CEP, CNPJ, `action`) | Senha, token, hash, secret, `code` de e-mail, documento, API key, `Authorization` |
| `adapter: '<vendor>'` em infra | Valor completo de cache, HTML de e-mail, body cru com campo sensível |

**Reusar contexto**, não inflar o enum: outro método do mesmo capability → mesmo `LogContext` + `action` diferente.

**Novo contexto** só se for recorte novo (novo port de infra, novo canal driving). Valor do enum = kebab do recorte (`cnpj-lookup` → `LogContext.CNPJ_LOOKUP = 'cnpj-lookup'`). Arquivo: `logs/cnpj-lookup.log`.

**Proibido:** `console.log` / `console.error`, `@nestjs/common` `Logger`, importar `winston` fora do adapter Winston, criar segundo `LoggerModule`.

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Novo port + log no adapter | Skill `using-ports-and-adapters` (ACL, register) **e** esta skill (payload) |
| Novo vendor de logger (pino, …) | Skill `using-ports-and-adapters` + skill `using-core-config` — **não** esta skill |
| Sentry / APM | Fora (sem skill; planejada using-error-tracking) |
| Auditoria de use case com interceptor | Fora (sem skill; planejada auditing-with-interceptors) — só com pedido do usuário |
| Recriar `LoggerModule` / adapter Winston / fake | Proibido |

## debug vs error

| Método | Quando |
|--------|--------|
| `error` | Falha: `catch`, vendor down, CEP/CNPJ não encontrado depois do HTTP, exception no filter |
| `debug` | Sucesso de I/O que precisa de rastro (cache mutação). Lookup HTTP feliz **não** precisa de debug |

Hot path (ex.: `set` no auth a cada request): parâmetro `skipLog` no **port** só se o contrato já tiver isso. Não logar valor do cache.

Filter HTTP: só `error` (já é exception). Não duplicar o mesmo HTTP error no controller.

## Injeção

`LoggerModule` é `@Global()` e já entra via `InfraModule.register()`. Consumidor **não** reimporta o módulo. Só injeta:

```ts
constructor(
  @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
) {}
```

Imports: `TOKENS` de `src/core/di/token`; `ILoggerGateway` e `LogContext` de `src/infra/logger/logger.gateway`.

Modificadores: `private readonly logger`. Construtor público **sem** a palavra `public`.

## Contexto e payload novos

Mesmo diff, três peças. `CommomData` já tem `accountId?`, `error?`, `adapter?` — **reusar**, não duplicar.

```ts
export enum LogContext {
  // ...valores já existentes
  QUEUE = 'queue',
}

export type LogContextDataMap = {
  // ...índices já existentes
  [LogContext.QUEUE]: QueueData
}

type QueueData = CommomData & {
  action: string;
  jobId?: string;
};
```

Tipo do payload: campos da **operação nossa** (ACL). Não campo cru do vendor (`logradouro`, `ETag`). `adapter` = kebab do vendor (`viacep`, `redis`, `cnpja`, `nodemailer`, `aws-s3`).

Chamada:

```ts
this.logger.error(LogContext.CEP_LOOKUP, {
  adapter: 'viacep',
  cep: normalizedCep,
  error,
});
```

```ts
this.logger.debug(LogContext.CACHE, {
  adapter: 'redis',
  action: 'delete',
  key,
});
```

TypeScript obriga o objeto a bater com o mapa. Não passar payload genérico `Record<string, unknown>`.

`ILoggerGateway` só tem `debug` e `error`. Não inventar `info`/`warn` na porta.

## Segredos

Nunca no payload (nem em `error.message` se a mensagem carregar secret):

- senha, hash bcrypt, salt
- `accessToken`, `refreshToken`, `passwordResetToken`, JWT
- `code` (OTP / e-mail), `credential`, `document` (CPF/CNPJ completo em log HTTP body)
- API key, `Authorization`, SMTP password, AWS secret

HTTP body no filter: mascarar com `****` as chaves `password`, `passwordResetToken`, `refreshToken`, `accessToken`, `credential`, `code`, `document` (case-insensitive, recursivo). Outro log com body: a mesma lista.

SMTP: logar `{ to }`, **não** `code` nem HTML.

CNPJ/CEP no log de **adapter** (identificador da consulta) é permitido; não copiar a resposta inteira do vendor para o log.

## Spec

Skill `writing-unit-tests`. No spec do **consumidor** (adapter, filter):

- mock `ILoggerGateway` (`createMock`) via `TOKENS.LoggerGateway`
- error path: `expect(logger.error).toHaveBeenCalledWith(LogContext.X, expect.objectContaining({ … }))`
- debug path: idem em `logger.debug`
- payload **não** contém campo sensível

Não reescrever spec do Winston/Fake/LoggerModule só porque nasceu um `LogContext` — o Winston já cobre “um file transport por valor do enum”.

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Spec do consumidor (adapter, filter) | Skill `writing-unit-tests` (**obrigatório**) |
| `LOGGER_VENDOR` e demais env | Skill `using-core-config` |
| Spec do Winston, do fake e do `LoggerModule` | Não reescrever só porque nasceu um `LogContext` |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Ponto é fronteira (adapter real, filter HTTP, ou recorte novo pedido). Não domínio, não `console.log`
- [ ] `debug` vs `error` correto; happy path de lookup HTTP sem debug obrigatório
- [ ] Contexto: reuso **ou** enum + type + `LogContextDataMap` no mesmo diff
- [ ] Winston **não** editado só por contexto novo
- [ ] `@Inject(TOKENS.LoggerGateway)`; payload bate no mapa; `adapter` no log de infra
- [ ] Zero segredo; SMTP sem `code`/HTML; cache sem value
- [ ] Spec do consumidor cobre chamada ao logger (`writing-unit-tests`), suíte passando
- [ ] Modificador explícito nos membros novos; `constructor` público sem `public`
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
