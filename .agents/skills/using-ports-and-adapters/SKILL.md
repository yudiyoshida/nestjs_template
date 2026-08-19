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
- inspecione cache, logger, smtp, cep-lookup ou upload-file para inferir convenções
- copie estilo de adapter legado, mesmo que divirja desta skill

Se um adapter existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou (contrato da API, SDK, regra de negócio)
- `src/core/di/token.ts` — só para **inserir** o Symbol novo
- `src/infra/logger/logger.gateway.ts` — só para **inserir** `LogContext` + tipo do mapa, se o adapter for logar
- o módulo Nest que vai **importar** `XxxModule.register()`

Exceção: usuário apontar um arquivo como referência, ou pedir edição de um gateway que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que o conceito é um port de infra (não DAO/Repo de módulo, não controller, não helper)
- [ ] 2. Definir a interface IXxxGateway na linguagem da aplicação (ACL: zero tipo/campo/erro de vendor)
- [ ] 3. Adicionar TOKENS.XxxGateway em src/core/di/token.ts
- [ ] 4. Escrever adapter real (ACL: mapear vendor ↔ porta em métodos privados) e adapter fake
- [ ] 5. Escrever XxxModule.register() (fake em test, real nos demais)
- [ ] 6. LogContext novo, se o adapter logar
- [ ] 7. Erro: reusar ExternalApiError ou criar via creating-custom-errors
- [ ] 8. Specs via writing-unit-tests (obrigatório no adapter real; fake se tiver lógica)
- [ ] 9. Importar XxxModule.register() onde o port for injetado
- [ ] 10. Checklist de entrega
```

## Quando usar ports and adapters

Hexagonal (ports & adapters): o **centro** (application/domain) não conhece Redis, AWS, ViaCEP, Nodemailer. Conhece só a **porta** (interface). O **adapter** fala com o mundo externo e traduz para o contrato da porta.

Neste projeto, `src/infra` concentra **driven adapters** compartilhados: a aplicação chama o port; o adapter chama o serviço externo.

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

### Quando não criar port em `src/infra`

| Situação | Onde vai |
|----------|----------|
| Persistência de entidade do módulo (Prisma `save`/`findById`) | Port `IXxxRepository` / `IXxxDao` no módulo — **fora desta skill** |
| HTTP de entrada (controller) | Driving adapter no módulo (`infra/drivers/http`) — **fora desta skill** |
| Validação de request, Swagger, filter Nest | `src/infra/validators`, `openapi`, `core/filters` — não são ports |
| `PrismaService` / `DatabaseModule` | Cliente compartilhado, não é `IXxxGateway` |
| Helper puro in-process (montar chave de cache) | Função/classe no próprio recorte, sem porta |
| Primitivo ou VO | Skill `creating-value-objects` |

## Estrutura de pastas

```
src/infra/<kebab>/
  <kebab>.gateway.ts
  <kebab>.module.ts
  dtos/
    <kebab>.dto.ts
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

**Obrigatório:** método, getter, setter e atributo declaram `public`, `private` ou `protected` — inclusive públicos.

**Exceção:** `constructor` público **sem** a palavra `public`. Parameter properties no construtor usam `private readonly` (e `@Inject` quando for token).

## Token

Em `src/core/di/token.ts`, **adicionar** uma linha no objeto `TOKENS` (não reordenar o resto):

```ts
XxxGateway: Symbol.for('XxxGateway'),
```

O string do `Symbol.for` é **idêntico** à chave. Application injeta `TOKENS.XxxGateway`, nunca a classe do adapter.

## Templates

Estilo: indent 2, aspas simples, `semi`, vírgula final em multiline, `else` em nova linha.

### 1. Porta

Só interface + tipos/DTOs da porta. Zero SDK, zero `@Injectable`, zero tipo de vendor/Multer/Axios.

```ts
import { CepLookupOutputDto } from './dtos/cep-lookup.dto';

export interface ICepLookupGateway {
  lookup(cep: string): Promise<CepLookupOutputDto>;
}
```

DTO da porta = formato da aplicação (não `cep`/`logradouro`):

```ts
export class CepLookupOutputDto {
  zipCode: string;
  street: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}
```

Ou `export type` quando for só input (ex.: e-mail). Sem decorator Swagger no DTO da porta.

### 2. Adapter real (ACL)

Mapeia vendor ↔ DTO da porta em métodos **privados**. Credenciais só via `ConfigService`. Falha de integração: log + `ExternalApiError` (já existe em `src/shared/errors/external-api.error.ts`) — **não** criar erro novo com a mesma semântica.

O método público da porta orquestra: validar entrada nossa → chamar vendor → `toPort`. Não devolver `result.data` cru.

```ts
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { ICepLookupGateway } from '../../cep-lookup.gateway';
import { CepLookupOutputDto } from '../../dtos/cep-lookup.dto';
import { ViacepOutputDto } from './dtos/viacep.dto';

@Injectable()
export class CepLookupViacepAdapterGateway implements ICepLookupGateway {
  private readonly CEP_LENGTH = 8;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  public async lookup(cep: string): Promise<CepLookupOutputDto> {
    const normalizedCep = cep.replace(/\D/g, '');
    if (normalizedCep.length !== this.CEP_LENGTH) {
      throw new ExternalApiError('CEP inválido');
    }

    try {
      const result = await this.httpService.axiosRef.get<ViacepOutputDto>(
        `${this.configService.viacepApiUrl}/${normalizedCep}/json/`,
      );

      if (result.data?.erro === true || !result.data?.cep) {
        throw new ExternalApiError('CEP não encontrado');
      }

      return this.toPort(result.data);
    }
    catch (error) {
      this.logger.error(LogContext.CEP_LOOKUP, {
        adapter: 'viacep',
        cep: normalizedCep,
        error,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao buscar CEP');
    }
  }

  private toPort(data: ViacepOutputDto): CepLookupOutputDto {
    return {
      zipCode: data.cep,
      street: data.logradouro ?? '',
      complement: data.complemento?.trim() || null,
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
    };
  }
}
```

Se a porta envia um comando complexo, espelhar `private toVendor(input: PortInput): VendorPayload`.

Ordem na classe: constantes `private readonly` → campos → `constructor` → métodos `public` da porta → helpers `private` (`toPort`, `toVendor`, parse de URL, etc.).

**Best-effort (só cache-like):** se o contrato da porta é “nunca derrubar o request”, capturar erro, logar e devolver `null`/void. Default desta skill: **lançar** `ExternalApiError`.

### 3. Adapter fake

Mesma interface. Sem rede, sem SDK, sem `ConfigService`. Prefixo `_` em parâmetro da interface não usado.

```ts
import { Injectable } from '@nestjs/common';
import { ICepLookupGateway } from '../../cep-lookup.gateway';
import { CepLookupOutputDto } from '../../dtos/cep-lookup.dto';

@Injectable()
export class CepLookupFakeAdapterGateway implements ICepLookupGateway {
  public async lookup(cep: string): Promise<CepLookupOutputDto> {
    return {
      zipCode: cep,
      street: cep,
      complement: null,
      neighborhood: cep,
      city: cep,
      state: cep,
    };
  }
}
```

Fake com estado (Map, lista de envios) é válido para teste. Fake no-op (`debug`/`error` vazios) também.

### 4. Módulo — padrão `register()`

Majoridade: `static register(): DynamicModule`, `useClass` conforme `NODE_ENV === Environment.Test`.

```ts
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { CepLookupFakeAdapterGateway } from './adapters/fake/cep-lookup-fake.gateway';
import { CepLookupViacepAdapterGateway } from './adapters/viacep/cep-lookup-viacep.gateway';

@Module({})
export class CepLookupModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: CepLookupModule,
      imports: [
        ConfigModule,
        HttpModule,
      ],
      providers: [
        {
          provide: TOKENS.CepLookupGateway,
          useClass: isTest ? CepLookupFakeAdapterGateway : CepLookupViacepAdapterGateway,
        },
      ],
      exports: [
        TOKENS.CepLookupGateway,
      ],
    };
  }
}
```

`HttpModule` só se o adapter real usar `@nestjs/axios`. `ConfigModule` sempre que houver `ConfigService`.

**`@Global()`:** só se dezenas de módulos precisarem do port sem importar (logger, cache). Mesmo global, o binding continua `TOKENS.XxxGateway` + fake em test. Não colocar capability novo em `InfraModule` por inércia — importar `XxxModule.register()` no módulo Nest que injeta o port.

### 5. Consumo (application / guard / filter)

```ts
constructor(
  @Inject(TOKENS.CepLookupGateway) private readonly cepLookup: ICepLookupGateway,
) {}
```

Importar `ICepLookupGateway` de `src/infra/<kebab>/<kebab>.gateway.ts` e `TOKENS` de `src/core/di/token`.

**Proibido** no application/domain: importar classe `*AdapterGateway`, DTO de vendor, `redis`, `@aws-sdk/*`, `nodemailer`, URL do vendor, `Express.Multer.File`.

## Log

Se o adapter logar: injetar `ILoggerGateway` com `@Inject(TOKENS.LoggerGateway)`. Incluir `adapter: '<vendor>'` no payload.

Acrescentar em `LogContext` e em `LogContextDataMap` (mesmo arquivo da porta de logger):

```ts
export enum LogContext {
  // ...valores já existentes
  XXX = 'xxx',
}

type XxxData = CommomData & {
  action: string;
  // campos úteis da operação, sem segredo (senha, token, hash)
};
```

E o índice: `[LogContext.XXX]: XxxData`.

Não logar senha, secret, token, hash, body de e-mail completo se contiver dado sensível.

## Erros

Integração externa que o cliente precisa saber: `ExternalApiError` (`HttpStatus.SERVICE_UNAVAILABLE`). Reusar.

Erro com semântica nova: skill `creating-custom-errors` — localização típica `src/shared/errors/` se for infra compartilhada.

Não lançar `HttpException` / `Error` nativo no adapter.

## Regras

- Application depende da **porta**; adapter depende do **vendor**
- Adapter = ACL: `toPort` / `toVendor` privados; use case nunca vê modelo externo
- Valor devolvido ao use case já está no DTO da porta
- Config (URL, bucket, host) só em `ConfigService` — se a chave não existir, adicionar lá, não hardcode
- Um capability = uma porta. Não misturar SMTP + S3 na mesma interface
- Fake e real implementam **todos** os métodos da porta (fake já devolve DTO da porta)
- Comentário só se citar contrato/docs do vendor

## Fora do escopo

| Artefato | Delegar / não fazer |
|----------|---------------------|
| `<kebab>-<vendor>.gateway.spec.ts` | Skill `writing-unit-tests` (**obrigatório**) |
| Fake com lógica (TTL, Map) `.spec.ts` | Skill `writing-unit-tests` (**obrigatório**) |
| Fake no-op sem ramo | Spec opcional |
| Classe de erro nova | Skill `creating-custom-errors` |
| DAO/Repository Prisma do módulo | Fora — não usar esta skill |
| Controller HTTP | Fora |
| Ligar o VO/use case além do `@Inject` | Só se o usuário pedir |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Conceito é port de infra compartilhado (não persistência de módulo, não controller)
- [ ] Pasta `src/infra/<kebab>/` com porta, `register()`, adapter real, adapter fake
- [ ] Interface `IXxxGateway`; token `TOKENS.XxxGateway` = `Symbol.for('XxxGateway')`
- [ ] Application/domain não importam adapter, SDK nem tipo de vendor/Multer
- [ ] Porta e DTOs da capability: linguagem da aplicação; zero campo/tipo/erro do vendor
- [ ] Adapter real é ACL: `toPort`/`toVendor` (ou equivalentes privados); falha do vendor traduzida
- [ ] DTO da porta ≠ DTO do vendor; DTO de vendor só em `adapters/<vendor>/dtos/`
- [ ] Teste usa fake via `NODE_ENV === Environment.Test` no `register()`
- [ ] Falha de I/O: `ExternalApiError` ou erro via `creating-custom-errors` (reuso primeiro)
- [ ] Log (se houver): `LogContext` + mapa atualizados; `adapter` no payload; sem segredo
- [ ] Modificador explícito em todo membro; `constructor` público sem `public`
- [ ] Spec do adapter real existe, escrito com `writing-unit-tests`, suíte passando
- [ ] Spec do fake existe se o fake tiver lógica; suíte passando
- [ ] `XxxModule.register()` importado no módulo Nest consumidor (ou `@Global()` justificado)
- [ ] Nenhum padrão copiado de outros adapters do repo — apenas esta skill
