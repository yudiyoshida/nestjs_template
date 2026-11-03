# Templates

Leia este arquivo antes de escrever a porta, o adapter real, o adapter fake, o `XxxModule.register()` ou o consumo do port.

Estilo: indent 2, aspas simples, `semi`, vírgula final em multiline, `else` em nova linha.

Import `'<Símbolo>'`: trocar pelo caminho real do arquivo que exporta o símbolo (seção "Bloco base" do `SKILL.md`). Imports relativos entre arquivos do mesmo capability ficam como no template.

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

Mapeia vendor ↔ DTO da porta em métodos **privados**. Credenciais só via `ConfigService`. Falha de integração: log + `ExternalApiError` (seção "Bloco base") — **não** criar erro novo com a mesma semântica.

O método público da porta orquestra: validar entrada nossa → chamar vendor → `toPort`. Não devolver `result.data` cru.

```ts
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '<ConfigService>';
import { TOKENS } from '<TOKENS>';
import { LogContext, type ILoggerGateway } from '<LogContext>';
import { ExternalApiError } from '<ExternalApiError>';
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

Majoridade: `static register(): DynamicModule`. Em `NODE_ENV === Environment.Test` força key `fake`. Fora de test: `process.env.<CAPABILITY>_VENDOR` + type guard + mapa. `fake` **é** valor válido de `*_VENDOR` (dev/staging sem vendor real).

Chave env = capability SCREAMING_SNAKE + `_VENDOR` (ex.: `CEP_LOOKUP_VENDOR`). Valor = kebab no registro de vendors (`fake` + pastas `adapters/<vendor>/`). Declarar com skill `using-core-config` no mesmo diff.

Cada entry do mapa é um **binding**:

```ts
type XxxAdapterBinding = {
  class: Type<IXxxGateway>;
  modules: Array<Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  providers: Provider[];
};
```

**Proibido:** `useClass: isTest ? Fake : UmConcreto` hardcoded. Sempre o mapa com binding.

```ts
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, ForwardReference, Module, Provider, Type } from '@nestjs/common';
import { ConfigModule } from '<ConfigModule>';
import { Environment } from '<Environment>';
import { isCepLookupVendor, CepLookupVendor } from '<CepLookupVendor>';
import { TOKENS } from '<TOKENS>';
import { CepLookupFakeAdapterGateway } from './adapters/fake/cep-lookup-fake.gateway';
import { CepLookupViacepAdapterGateway } from './adapters/viacep/cep-lookup-viacep.gateway';
import { ICepLookupGateway } from './cep-lookup.gateway';

type CepLookupAdapterBinding = {
  class: Type<ICepLookupGateway>;
  modules: Array<Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  providers: Provider[];
};

const CEP_LOOKUP_ADAPTERS: Record<CepLookupVendor, CepLookupAdapterBinding> = {
  [CepLookupVendor.Fake]: {
    class: CepLookupFakeAdapterGateway,
    modules: [],
    providers: [],
  },
  [CepLookupVendor.Viacep]: {
    class: CepLookupViacepAdapterGateway,
    modules: [ConfigModule, HttpModule],
    providers: [],
  },
};

@Module({})
export class CepLookupModule {
  static register(): DynamicModule {
    const vendor = process.env.NODE_ENV === Environment.Test
      ? CepLookupVendor.Fake
      : process.env.CEP_LOOKUP_VENDOR;
    const binding = isCepLookupVendor(vendor)
      ? CEP_LOOKUP_ADAPTERS[vendor]
      : undefined;

    if (!binding) {
      throw new Error(`Invalid CEP_LOOKUP_VENDOR "${vendor ?? ''}"`);
    }

    return {
      module: CepLookupModule,
      imports: [
        ...binding.modules,
      ],
      providers: [
        ...binding.providers,
        {
          provide: TOKENS.CepLookupGateway,
          useClass: binding.class,
        },
      ],
      exports: [
        TOKENS.CepLookupGateway,
      ],
    };
  }
}
```

`HttpModule` só no binding do adapter que usa `@nestjs/axios`. `ConfigModule` só no binding que injeta `ConfigService`. Fake: `modules: []`, `providers: []`.

**Novo vendor** (ex.: `adapters/brasilapi/` ou `fake` já existe):

1. Chave no objeto do registro de vendors (skill `using-core-config` + `requiredWhen` nas credenciais)
2. Pasta `adapters/<vendor>/` + entry no mapa com `class` / `modules` / `providers` usando `XxxVendor.Real`

Compile time: vendor novo sem linha no mapa → erro TS; classe que não implementa a porta → erro TS.

**`@Global()`:** só se dezenas de módulos precisarem do port sem importar (logger, cache). Mesmo global, o binding continua via `register()`. Não registrar capability novo num módulo agregador global por inércia — importar `XxxModule.register()` no módulo Nest que injeta o port.

### 5. Consumo (application / guard / filter)

```ts
constructor(
  @Inject(TOKENS.CepLookupGateway) private readonly cepLookup: ICepLookupGateway,
) {}
```

Importar `ICepLookupGateway` do arquivo da porta (`src/infra/<kebab>/<kebab>.gateway.ts`) e `TOKENS` do arquivo que o exporta.

**Proibido** no application/domain: importar classe `*AdapterGateway`, DTO de vendor, `redis`, `@aws-sdk/*`, `nodemailer`, URL do vendor, `Express.Multer.File`.

