---
name: using-core-config
description: Lê e declara variáveis de ambiente só via ConfigService próprio (wrapper tipado de @nestjs/config, Joi no ConfigModule, Environment). Use quando o código ou o usuário precisar de env, process.env, .env, ConfigService, @nestjs/config, Joi de env, NODE_ENV, PORT, secret, URL de vendor, SSL, JWT, Redis, SMTP, AWS, DATABASE_URL, ou ao adicionar/alterar/remover variável de ambiente.
---

# Using Core Config

Única forma de ler env no sistema Nest: injetar o `ConfigService` próprio (wrapper de `@nestjs/config`, seção "Bloco base"). Getter tipado. Nunca `process.env` no application/domain/infra (fora das exceções desta skill).

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de env.**

Todo o padrão — getter, Joi, `.env.example`, injeção, exceções de `process.env` — está definido aqui e apenas aqui.

Antes de escrever código, **não**:

- leia adapters, use cases, strategies, `main.ts` ou módulos para copiar como eles leem env
- rode grep/glob por `process.env`, `nestConfigService.get`, `ConfigService as NestConfigService`
- copie `process.env.JWT_SECRET` de strategy/Passport legado

Se código existente contradiz esta skill, **esta skill vence**. Não imite o legado.

**Obrigatório ler e editar** (não para copiar formato — para inserir/alterar a chave). Localizar cada peça pela busca do export; peça ausente → criar pela seção "Bloco base":

- `ConfigModule` (`export class ConfigModule`) — schema Joi
- `ConfigService` (`export class ConfigService`) — getter
- spec do `ConfigService` (`.spec.ts` ao lado dele) — spec do getter
- `.env.example` na raiz do repositório — chave documentada
- registro de vendors (`export const <Capability>Vendor`) — **só** se a chave for `*_VENDOR` (objeto const + type + guard)

Exceção: usuário apontar um arquivo, ou pedir edição de getter/schema que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que o valor vem de env (não de request, não de banco, não de constante de domínio)
- [ ] 2. Localizar ConfigModule, ConfigService e Environment pelo export (ausente → seção "Bloco base")
- [ ] 3. Getter já existe em ConfigService? → só injetar e usar. Parar.
- [ ] 4. Se não existe: Joi + getter + spec + .env.example no mesmo diff
- [ ] 5. Consumir só via this.configService.<getter>
- [ ] 6. Importar ConfigModule no módulo Nest que injeta ConfigService
- [ ] 7. Checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Adapter/use case/guard precisa de URL, secret, host, porta, bucket, TTL | Getter no `ConfigService` + injetar |
| Usuário pede "adicionar env", "nova variável", `.env`, `process.env` | Conjunto atômico |
| Módulo Nest `registerAsync` / `useFactory` precisa de secret | `inject: [ConfigService]` |
| Depois de `NestFactory.create`, CORS/listen/Swagger | `app.get(ConfigService)` |
| Comparar ambiente (dev/prod/test) em classe injetável | `configService.isDevelopment` / `isProduction` / `isTest` |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Dado do request/body/query | DTO + pipe |
| Dado persistido | Repositório / DAO |
| Constante de domínio sem I/O | Constante no recorte |
| Script fora do Nest (Postman, codegen) | Fora desta skill |
| Escolher fake vs real em `XxxModule.register()` | `process.env.NODE_ENV === Environment.Test` — skill `using-ports-and-adapters` |
| Escolher vendor real em `XxxModule.register()` | `process.env.<CAPABILITY>_VENDOR` + mapa — skill `using-ports-and-adapters` |

## Nomeação

| Peça | Forma | Exemplo |
|------|-------|---------|
| Chave env / Joi | `SCREAMING_SNAKE` | `VIACEP_API_URL` |
| Getter | camelCase da chave | `viacepApiUrl` |
| Path de arquivo | camelCase + `Path` | `SSL_KEY` → `sslKeyPath` |
| Flag de ambiente | `is` + enum | `isTest`, `isProduction`, `isDevelopment` |
| Grupo no service | comentário `// smtp` | bloco de getters SMTP |

Tipo do getter = tipo Joi (`Joi.number()` ↔ `get foo(): number`). `!` no `get` — Joi já validou na boot.

## Bloco base

Localizar cada símbolo pela busca do export antes de escrever. Se não existir, criar pelo template abaixo, no destino indicado. Pacotes: `@nestjs/config` e `joi` (instalar se faltarem).

| Símbolo | Localizar por | Destino se ausente |
|---------|---------------|--------------------|
| `Environment` | `export enum Environment` | `src/core/config/environment.enum.ts` |
| `ConfigService` | `export class ConfigService` | `src/core/config/config.service.ts` |
| `ConfigModule` | `export class ConfigModule` | `src/core/config/config.module.ts` |
| Registro de vendors | `export const <Capability>Vendor` | `src/infra/infra-vendors.ts` (template em "1. Schema Joi") |

```bash
grep -rn "export class ConfigService" src
```

`Environment`:

```ts
export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}
```

`ConfigService` — wrapper tipado; getters novos entram por grupo temático abaixo de `// environment`:

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Environment } from '<Environment>';

@Injectable()
export class ConfigService {
  constructor(private readonly nestConfigService: NestConfigService) {}

  // environment
  get nodeEnv(): Environment {
    return this.nestConfigService.get<Environment>('NODE_ENV')!;
  }
  get isDevelopment(): boolean {
    return this.nodeEnv === Environment.Development;
  }
  get isProduction(): boolean {
    return this.nodeEnv === Environment.Production;
  }
  get isTest(): boolean {
    return this.nodeEnv === Environment.Test;
  }
}
```

`ConfigModule` — não é `@Global()`; quem injeta `ConfigService` importa este módulo. O helper `requiredWhen` entra junto com a primeira credencial de vendor (template 1):

```ts
import Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from '<ConfigService>';
import { Environment } from '<Environment>';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: `.env.${process.env.NODE_ENV || Environment.Development}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid(...Object.values(Environment)).required(),
      }),
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

`.env.example` ausente → criar na raiz do repositório, vazio (`NODE_ENV` não entra; ver "Regra de ouro").

## Templates

Estilo: indent 2, aspas simples, `semi`, vírgula final em multiline.

Import `'<Símbolo>'`: trocar pelo caminho real do arquivo que exporta o símbolo (seção "Bloco base").

### 1. Schema Joi (`ConfigModule`)

Inserir no `Joi.object({ ... })`, no grupo temático (server, jwt, smtp, …). Não reordenar o resto.

```ts
FOO_BAR: Joi.string().required(),
FOO_TIMEOUT: Joi.number().required(),
```

`NODE_ENV` já vem no bloco base: `Joi.string().valid(...Object.values(Environment)).required()`.

Port de infra — vendor selector. Fonte dos kebabs: registro de vendors (nunca literal no Joi).

```ts
// registro de vendors
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
// ConfigModule — helper local
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

### 2. Getter (`ConfigService`)

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
import { ConfigService } from '<ConfigService>';

constructor(private readonly configService: ConfigService) {}

// uso
this.configService.fooBar
this.configService.fooTimeout
this.configService.isTest
```

Adapter fake: **sem** `ConfigService`.

### 4. Consumo em módulo Nest (`registerAsync` / `useFactory`)

`ConfigModule` próprio (seção "Bloco base"), não o de `@nestjs/config`.

`ConfigModule` **não** é `@Global()`. `NestConfigModule.forRoot({ isGlobal: true })` não exporta o nosso `ConfigService`. Quem injeta **importa** `ConfigModule`.

Ex.: `JwtModule` com getters `jwtSecret` e `jwtExpiresIn` (criados pelo conjunto atômico):

```ts
import { ConfigModule } from '<ConfigModule>';
import { ConfigService } from '<ConfigService>';

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

Skill `writing-unit-tests` para a estrutura. Montagem: `sut` = `ConfigService`; `nestConfigService` = `createMock<NestConfigService>()` passado no construtor, no `beforeEach`. Um describe por getter novo:

```ts
describe('fooBar', () => {
  describe('Happy path', () => {
    it('should return FOO_BAR from the env', () => {
      // Arrange
      jest.spyOn(nestConfigService, 'get').mockReturnValue('foo');

      // Act
      const result = sut.fooBar;

      // Assert
      expect(result).toBe('foo');
      expect(nestConfigService.get).toHaveBeenCalledWith('FOO_BAR');
    });
  });
});
```

Teste de consumidor: mockar `ConfigService` (getter devolver valor). **Proibido** `process.env.X = '...'` para alimentar produção.

## Regra de ouro

**Mudou variável de ambiente → atualizar `ConfigService` no mesmo diff.** Sempre.

Nunca adicionar chave no `.env` / Joi sem getter. Nunca adicionar getter sem Joi. Nunca ler a chave sem passar pelo getter.

Conjunto atômico (os quatro juntos, ou nenhum):

| Peça | O que muda |
|------|------------|
| `ConfigModule` | `CHAVE: Joi.<tipo>().required()` (ou `Joi.when` se credencial de vendor) no `validationSchema` |
| `ConfigService` | getter camelCase + `this.nestConfigService.get<T>('CHAVE')!` |
| spec do `ConfigService` | spec via skill `writing-unit-tests` |
| `.env.example` | `CHAVE=` (valor de exemplo só se já houver padrão no arquivo) |

**Única chave do Joi fora do `.env.example`: `NODE_ENV`.** Ela vem do processo (script npm:
`NODE_ENV=test jest`), não do arquivo — o próprio `envFilePath` é `.env.${NODE_ENV}`. Toda chave
nova, sem exceção, entra no `.env.example`.

Todo port de infra com `register()` inclui `*_VENDOR` no conjunto atômico **mais** o registro de vendors:

1. Objeto `XxxVendor = { Fake: 'fake', Real: 'kebab' } as const` + type + `XXX_VENDORS = Object.values(XxxVendor)` + guard `isXxxVendor`
2. Joi: `Joi.string().valid(...XXX_VENDORS).required()` — **proibido** literal solto no `.valid()` / `is:` de vendor
3. Credenciais: `requiredWhen('*_VENDOR', XxxVendor.Real)` (helper no `config.module`; `Joi.number()` no 3º arg se preciso)
4. Getter tipado: `get xxxVendor(): XxxVendor`
5. Spec + `.env.example`

Valor = `XxxVendor.Fake` + kebabs reais. `*_VENDOR=fake` permite fluxo sem I/O externo.

Remover variável: apagar os quatro (+ entrada no registro de vendors se for `*_VENDOR`). Renomear/trocar tipo: os quatro.

`Environment` só muda se nascer um runtime novo (`development` / `production` / `test`). Variável de app **não** entra no enum.

## Proibido

- `process.env.QUALQUER_COISA` em application, domain, adapter, strategy, filter, interceptor, guard
- `ConfigService` de `@nestjs/config` no consumidor (alias `NestConfigService` só dentro do `ConfigService`)
- `this.nestConfigService.get('X')` fora do `ConfigService`
- String solta `'JWT_SECRET'` / `'REDIS_URL'` fora do `ConfigService` e do Joi
- Getter novo sem Joi, ou Joi novo sem getter
- Env opcional (`optional()`, `default()`) sem o usuário pedir — **exceção:** `Joi.when` de credencial de vendor inativo (ver template)
- Logar valor de secret, password, token, key

## Exceções de `process.env` (só estas)

| Local | Por quê |
|-------|---------|
| `ConfigModule` → `envFilePath: \`.env.${process.env.NODE_ENV \|\| Environment.Development}\`` | NestConfig ainda não carregou |
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

## Red flags

Qualquer item abaixo → parar e corrigir.

- `process.env.` fora da tabela de exceções
- `from '@nestjs/config'` em arquivo que não é o `ConfigService`, o `ConfigModule` ou a spec do `ConfigService`
- Schema Joi mudou e o `ConfigService` não
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

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Spec do `ConfigService` (getters) | Skill `writing-unit-tests` (**obrigatório**) |
| `XxxModule.register()` e binding de vendor | Skill `using-ports-and-adapters` |
| `.env.development`, `.env.test`, `.env.production` (locais, fora do git) | Fora (sem skill) — só o `.env.example` é versionado |

## Checklist de entrega

Antes de responder, confirmar **todos** os que se aplicam:

- [ ] `ConfigModule`, `ConfigService` e `Environment` localizados pelo export (ou criados pela seção "Bloco base"); imports com o caminho real, não o placeholder
- [ ] Valor de env no runtime passa por getter do `ConfigService`
- [ ] Nenhum `process.env` fora da tabela de exceções
- [ ] Consumidor importa o `ConfigService` próprio, nunca o de `@nestjs/config`
- [ ] Módulo Nest que injeta `ConfigService` importa o `ConfigModule` próprio
- [ ] Variável nova/alterada/removida: Joi + getter + spec + `.env.example` no mesmo diff
- [ ] Nome: `SCREAMING_SNAKE` na chave, camelCase no getter; path de arquivo com sufixo `Path`
- [ ] Tipo Joi = tipo do getter; `!` no `get`
- [ ] Spec do getter via `writing-unit-tests`; consumidor mocka `ConfigService`, não `process.env`
- [ ] Fake de adapter sem `ConfigService`
- [ ] Port com vendor: objeto `XxxVendor` no registro de vendors + `*_VENDOR` no conjunto atômico; Joi usa `...XXX_VENDORS` + `requiredWhen(..., XxxVendor.Real)`
- [ ] Nenhum secret no log
