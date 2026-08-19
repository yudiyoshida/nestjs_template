---
name: using-core-config
description: Lê e declara variáveis de ambiente só via src/core/config (ConfigService, Joi no ConfigModule, Environment). Use quando o código ou o usuário precisar de env, process.env, .env, ConfigService, @nestjs/config, Joi de env, NODE_ENV, PORT, secret, URL de vendor, SSL, JWT, Redis, SMTP, AWS, DATABASE_URL, ou ao adicionar/alterar/remover variável de ambiente.
---

# Using Core Config

Única forma de ler env no sistema Nest: injetar `ConfigService` de `src/core/config/config.service`. Getter tipado. Nunca `process.env` no application/domain/infra (fora das exceções desta skill).

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de env.**

Todo o padrão — getter, Joi, `.env.example`, injeção, exceções de `process.env` — está definido aqui e apenas aqui.

Antes de escrever código, **não**:

- leia adapters, use cases, strategies, `main.ts` ou módulos para copiar como eles leem env
- rode grep/glob por `process.env`, `nestConfigService.get`, `ConfigService as NestConfigService`
- copie `process.env.JWT_SECRET` de strategy/Passport legado

Se código existente contradiz esta skill, **esta skill vence**. Não imite o legado.

**Obrigatório ler e editar** (não para copiar formato — para inserir/alterar a chave):

- `src/core/config/config.module.ts` — schema Joi
- `src/core/config/config.service.ts` — getter
- `src/core/config/config.service.spec.ts` — spec do getter
- `.env.example` — chave documentada
- `src/infra/infra-vendors.ts` — **só** se a chave for `*_VENDOR` (objeto const + type + guard)

Exceção: usuário apontar um arquivo, ou pedir edição de getter/schema que já existe — leia só esse arquivo.

## Regra de ouro

**Mudou variável de ambiente → atualizar `ConfigService` no mesmo diff.** Sempre.

Nunca adicionar chave no `.env` / Joi sem getter. Nunca adicionar getter sem Joi. Nunca ler a chave sem passar pelo getter.

Conjunto atômico (os quatro juntos, ou nenhum):

| Arquivo | O que muda |
|---------|------------|
| `src/core/config/config.module.ts` | `CHAVE: Joi.<tipo>().required()` (ou `Joi.when` se credencial de vendor) no `validationSchema` |
| `src/core/config/config.service.ts` | getter camelCase + `this.nestConfigService.get<T>('CHAVE')!` |
| `src/core/config/config.service.spec.ts` | spec via skill `writing-unit-tests` |
| `.env.example` | `CHAVE=` (valor de exemplo só se já houver padrão no arquivo) |

**Única chave do Joi fora do `.env.example`: `NODE_ENV`.** Ela vem do processo (script npm:
`NODE_ENV=test jest`), não do arquivo — o próprio `envFilePath` é `.env.${NODE_ENV}`. Toda chave
nova, sem exceção, entra no `.env.example`.

Todo port de infra com `register()` inclui `*_VENDOR` no conjunto atômico **mais** `src/infra/infra-vendors.ts`:

1. Objeto `XxxVendor = { Fake: 'fake', Real: 'kebab' } as const` + type + `XXX_VENDORS = Object.values(XxxVendor)` + guard `isXxxVendor`
2. Joi: `Joi.string().valid(...XXX_VENDORS).required()` — **proibido** literal solto no `.valid()` / `is:` de vendor
3. Credenciais: `requiredWhen('*_VENDOR', XxxVendor.Real)` (helper no `config.module`; `Joi.number()` no 3º arg se preciso)
4. Getter tipado: `get xxxVendor(): XxxVendor`
5. Spec + `.env.example`

Valor = `XxxVendor.Fake` + kebabs reais. `*_VENDOR=fake` permite fluxo sem I/O externo.

Remover variável: apagar os quatro (+ linha em `infra-vendors.ts` se for `*_VENDOR`). Renomear/trocar tipo: os quatro.

`Environment` (`environment.enum.ts`) só muda se nascer um runtime novo (`development` / `production` / `test`). Variável de app **não** entra no enum.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que o valor vem de env (não de request, não de banco, não de constante de domínio)
- [ ] 2. Getter já existe em ConfigService? → só injetar e usar. Parar.
- [ ] 3. Se não existe: Joi + getter + spec + .env.example no mesmo diff
- [ ] 4. Consumir só via this.configService.<getter>
- [ ] 5. Importar ConfigModule no módulo Nest que injeta ConfigService
- [ ] 6. Checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Adapter/use case/guard precisa de URL, secret, host, porta, bucket, TTL | Getter no `ConfigService` + injetar |
| Usuário pede "adicionar env", "nova variável", `.env`, `process.env` | Conjunto atômico |
| Módulo Nest `registerAsync` / `useFactory` precisa de secret | `inject: [ConfigService]` |
| Depois de `NestFactory.create`, CORS/listen/Swagger | `app.get(ConfigService)` |
| Comparar ambiente (dev/prod/test) em classe injetável | `configService.isDevelopment` / `isProduction` / `isTest` |

## Quando não usar

| Situação | Onde vai |
|----------|----------|
| Dado do request/body/query | DTO + pipe |
| Dado persistido | Repositório / DAO |
| Constante de domínio sem I/O | Constante no recorte |
| Script fora do Nest (Postman, codegen) | Fora desta skill |
| Escolher fake vs real em `XxxModule.register()` | `process.env.NODE_ENV === Environment.Test` — skill `using-ports-and-adapters` |
| Escolher vendor real em `XxxModule.register()` | `process.env.<CAPABILITY>_VENDOR` + mapa — skill `using-ports-and-adapters` |

## Proibido

- `process.env.QUALQUER_COISA` em application, domain, adapter, strategy, filter, interceptor, guard
- `ConfigService` de `@nestjs/config` no consumidor (alias `NestConfigService` só dentro de `config.service.ts`)
- `this.nestConfigService.get('X')` fora de `config.service.ts`
- String solta `'JWT_SECRET'` / `'REDIS_URL'` fora de `config.service.ts` e do Joi
- Getter novo sem Joi, ou Joi novo sem getter
- Env opcional (`optional()`, `default()`) sem o usuário pedir — **exceção:** `Joi.when` de credencial de vendor inativo (ver template)
- Logar valor de secret, password, token, key

## Exceções de `process.env` (só estas)

| Local | Por quê |
|-------|---------|
| `config.module.ts` → `envFilePath: \`.env.${process.env.NODE_ENV \|\| Environment.Development}\`` | NestConfig ainda não carregou |
| `XxxModule.register()` → `process.env.NODE_ENV === Environment.Test` | Binding estático antes do DI; skill `using-ports-and-adapters` |
| `XxxModule.register()` → `process.env.<CAPABILITY>_VENDOR` | Binding estático do vendor antes do DI; skill `using-ports-and-adapters` |
| `main.ts` **antes** de `NestFactory.create` (HTTPS `SSL_KEY` / `SSL_CERT` / `SSL_CA`) | App ainda não existe; `app.get(ConfigService)` impossível |

Depois de `const app = await NestFactory.create(...)`: **só** `app.get(ConfigService)`. Inclusive `port`, `corsOrigin`. Não voltar para `process.env.PORT`.

Passport `super({ secretOrKey })`: injetar `ConfigService` no constructor e ler o getter **dentro** do `super(...)`. Não usar `process.env` porque o `super` “não tem DI”.

```ts
constructor(private readonly configService: ConfigService) {
  super({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    secretOrKey: configService.jwtSecret,
  });
}
```

## Nomeação

| Peça | Forma | Exemplo |
|------|-------|---------|
| Chave env / Joi | `SCREAMING_SNAKE` | `VIACEP_API_URL` |
| Getter | camelCase da chave | `viacepApiUrl` |
| Path de arquivo | camelCase + `Path` | `SSL_KEY` → `sslKeyPath` |
| Flag de ambiente | `is` + enum | `isTest`, `isProduction`, `isDevelopment` |
| Grupo no service | comentário `// smtp` | bloco de getters SMTP |

Tipo do getter = tipo Joi (`Joi.number()` ↔ `get foo(): number`). `!` no `get` — Joi já validou na boot.

## Templates

Estilo: indent 2, aspas simples, `semi`, vírgula final em multiline.

### 1. Schema Joi (`config.module.ts`)

Inserir no `Joi.object({ ... })`, no grupo temático (server, jwt, smtp, …). Não reordenar o resto.

```ts
FOO_BAR: Joi.string().required(),
FOO_TIMEOUT: Joi.number().required(),
```

`NODE_ENV` já existe: `Joi.string().valid(...Object.values(Environment)).required()`.

Port de infra — vendor selector. Fonte dos kebabs: `src/infra/infra-vendors.ts` (nunca literal no Joi).

```ts
// infra-vendors.ts
export const UploadFileVendor = {
  Fake: 'fake',
  AwsS3: 'aws-s3',
} as const;

export type UploadFileVendor = (typeof UploadFileVendor)[keyof typeof UploadFileVendor];

export const UPLOAD_FILE_VENDORS = Object.values(UploadFileVendor);

export function isUploadFileVendor(value: string | undefined): value is UploadFileVendor {
  return (UPLOAD_FILE_VENDORS as readonly string[]).includes(value ?? '');
}
```

```ts
// config.module.ts — helper local
function requiredWhen(vendorEnvKey: string, vendor: string, schema: Joi.Schema = Joi.string()) {
  return Joi.when(vendorEnvKey, {
    is: vendor,
    then: schema.required(),
    otherwise: schema.optional(),
  });
}

UPLOAD_FILE_VENDOR: Joi.string().valid(...UPLOAD_FILE_VENDORS).required(),
AWS_ACCESS_KEY_ID: requiredWhen('UPLOAD_FILE_VENDOR', UploadFileVendor.AwsS3),
```

**Novo vendor real:** acrescentar chave no objeto `UploadFileVendor` (ex.: `Azure: 'azure-storage-account'`); Joi já espalha `UPLOAD_FILE_VENDORS`. Credenciais: `requiredWhen('UPLOAD_FILE_VENDOR', UploadFileVendor.Azure)`. **Não** afrouxar schema por `NODE_ENV=test`.

```ts
AWS_ACCESS_KEY_ID: requiredWhen('UPLOAD_FILE_VENDOR', UploadFileVendor.AwsS3),
AZURE_STORAGE_CONNECTION_STRING: requiredWhen('UPLOAD_FILE_VENDOR', UploadFileVendor.Azure),
SMTP_PORT: requiredWhen('SMTP_VENDOR', SmtpVendor.Nodemailer, Joi.number()),
```

Getter da credencial continua com `!` — Joi garante presença quando o vendor ativo exige a chave. Getter do vendor retorna o union (`UploadFileVendor`), não `string`.

### 2. Getter (`config.service.ts`)

Inserir no grupo temático. Não reordenar o resto. Não extrair helper genérico `get(key)`.

```ts
get fooBar(): string {
  return this.nestConfigService.get<string>('FOO_BAR')!;
}

get fooTimeout(): number {
  return this.nestConfigService.get<number>('FOO_TIMEOUT')!;
}
```

### 3. Consumo em classe `@Injectable`

```ts
import { ConfigService } from 'src/core/config/config.service';

constructor(private readonly configService: ConfigService) {}

// uso
this.configService.fooBar
this.configService.redisUrl
this.configService.isTest
```

Adapter fake: **sem** `ConfigService`.

### 4. Consumo em módulo Nest (`registerAsync` / `useFactory`)

`ConfigModule` deste projeto (`src/core/config/config.module`), não o de `@nestjs/config`.

`ConfigModule` **não** é `@Global()`. `NestConfigModule.forRoot({ isGlobal: true })` não exporta o nosso `ConfigService`. Quem injeta **importa** `ConfigModule`.

```ts
import { ConfigModule } from 'src/core/config/config.module';
import { ConfigService } from 'src/core/config/config.service';

JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: configService.jwtSecret,
    signOptions: { expiresIn: configService.jwtExpiresIn },
  }),
})
```

### 5. Spec do getter

Skill `writing-unit-tests`. Espelhar os getters já testados: mock de `NestConfigService.get`, `expect(result).toBe(...)`, `toHaveBeenCalledWith('FOO_BAR')`.

Teste de consumidor: mockar `ConfigService` (getter devolver valor). **Proibido** `process.env.X = '...'` para alimentar produção.

## Red flags — parar e corrigir

- `process.env.` fora da tabela de exceções
- `from '@nestjs/config'` em arquivo que não é `config.service.ts` / `config.module.ts` / `config.service.spec.ts`
- Schema Joi mudou e `config.service.ts` não
- `.env.example` ganhou chave e o service não
- `app.listen(process.env.PORT)` / `secretOrKey: process.env.JWT_SECRET`
- Getter opcional ou `get<string>('X')` sem `!` “porque pode faltar”

| Desculpa | Realidade |
|----------|-----------|
| "É só no bootstrap / strategy / super()" | Depois do `create`, `app.get`. No `super`, injeta `ConfigService`. |
| "Joi já valida, posso ler process.env" | Consumidor não conhece a chave. Getter é o contrato. |
| "Vou adicionar o getter depois" | Diff incompleto. Conjunto atômico agora. |
| "É um script rápido / constante local" | Se vem de env, passa pelo service. |
| "ConfigModule é global" | NestConfig é global. Nosso `ConfigService` não. Importar `ConfigModule`. |
| "Fake também precisa da URL" | Fake não fala com vendor. Sem `ConfigService`. |
| "Vou deixar todas as credenciais required com 2 vendors" | `Joi.when` no vendor ativo. Credencial morta fica `optional`. |

## Checklist de entrega

Antes de responder, confirmar **todos** os que se aplicam:

- [ ] Valor de env no runtime passa por getter de `ConfigService` (`src/core/config/config.service`)
- [ ] Nenhum `process.env` fora da tabela de exceções
- [ ] Consumidor importa `ConfigService` de `src/core/config/config.service`, nunca de `@nestjs/config`
- [ ] Módulo Nest que injeta `ConfigService` importa `ConfigModule` de `src/core/config/config.module`
- [ ] Variável nova/alterada/removida: Joi + getter + spec + `.env.example` no mesmo diff
- [ ] Nome: `SCREAMING_SNAKE` na chave, camelCase no getter; path de arquivo com sufixo `Path`
- [ ] Tipo Joi = tipo do getter; `!` no `get`
- [ ] Spec do getter via `writing-unit-tests`; consumidor mocka `ConfigService`, não `process.env`
- [ ] Fake de adapter sem `ConfigService`
- [ ] Port com vendor: objeto `XxxVendor` em `infra-vendors.ts` + `*_VENDOR` no conjunto atômico; Joi usa `...XXX_VENDORS` + `requiredWhen(..., XxxVendor.Real)`
- [ ] Nenhum secret no log
