---
name: creating-value-objects
description: Cria value objects imutáveis e autovalidáveis em src/shared/value-objects ou em domain/value-objects do módulo, com sanitização, invariantes e getter value. Use quando o usuário pedir para criar value object, VO, objeto de valor, encapsular formato (CPF, e-mail, CEP), validar invariante em classe ou eliminar primitivos no domínio.
---

# Creating Value Objects

Cria classes de value object com validação na construção, estado `private readonly`, sanitização quando necessário e erro dedicado delegado à skill `creating-custom-errors`.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de value object.**

Todo o padrão — estrutura de pasta, nome de classe, `_value`, getters, sanitize/validate, factories estáticas, imutabilidade — está definido aqui e apenas aqui.

Portanto, antes de escrever o `.vo.ts`, **não**:

- leia, abra ou busque outros `*.vo.ts`, `*.error.ts` ou `*.vo.spec.ts` para copiar formato
- rode grep/glob por `private readonly _value`, `sanitize`, `validate`, `value-objects`
- inspecione VOs existentes em `src/shared/value-objects/` ou em módulos para inferir convenções
- copie estilo de VOs legados, mesmo que divirjam desta skill

Se um VO existente contradiz esta skill, **esta skill vence**. Nunca ajuste o arquivo novo para imitar um VO antigo.

**Permitido:** ler o que o usuário indicou como entrada (regra de negócio, entidade, DTO, spec de requisito) para entender o conceito — não para descobrir formatação de código.

Exceções: apenas quando o usuário pedir explicitamente para seguir um arquivo específico como referência, ou pedir para editar um `.vo.ts` que já existe — nesse caso leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que o conceito é um value object (não entidade nem DTO)
- [ ] 2. Decidir localização (shared vs módulo)
- [ ] 3. Escrever <kebab>.vo.ts seguindo o template adequado
- [ ] 4. Criar <kebab>.error.ts via skill creating-custom-errors (quando o VO lança erro customizado)
- [ ] 5. Criar <kebab>.vo.spec.ts via skill writing-unit-tests (obrigatório)
- [ ] 6. Rodar a suíte do `.vo.spec.ts` e o checklist de entrega
```

## Quando usar

Um value object representa um **conceito de domínio definido pelo valor**, não por identidade. Duas instâncias com os mesmos atributos são intercambiáveis; o que importa é o valor, não o objeto em memória.

### Critérios para criar

| Critério | O que significa |
|----------|-----------------|
| Igualdade por valor | Comparar atributos, não referência ou id |
| Imutabilidade | Alterar o conceito exige nova instância (ex.: `addDays` retorna outro VO) |
| Autovalidação | Instância inválida não pode existir; falha na construção |
| Formato ou invariante | Regex, dígitos verificadores, normalização, limites numéricos |
| Comportamento no conceito | Sanitizar, derivar, comparar datas, compor CPF/CNPJ |
| Anti-primitivo | A mesma validação não deve repetir em services e DTOs |
| Sem efeito colateral | Métodos calculam/retornam; não fazem I/O nem chamam repositório |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Identidade e ciclo de vida (id, versão, auditoria) | Entidade ou agregado |
| Só transporte HTTP (body/query de API) | DTO + `class-validator` |
| String/número sem regra nem comportamento | Primitivo |
| Precisa mutar estado in-place | Entidade ou modelo de persistência |
| Validação depende de serviço externo ou base de dados | Service + erro de aplicação |

### Decisão rápida: VO vs Entidade vs DTO

| Pergunta | VO | Entidade | DTO |
|----------|-----|----------|-----|
| Tem id persistente? | Não | Sim | Não (espelho de request/response) |
| Dois registros “iguais” são o mesmo conceito? | Sim | Não (ids diferentes) | N/A |
| Pode existir inválido após criado? | Não | Pode (estados de transição) | Pode até validar no pipe |
| Onde valida formato de e-mail/CPF? | No VO | — | Opcional (entrada HTTP) |
| Onde fica regra “FAQ expirado não edita”? | — | Entidade/domínio | — |

## Estrutura de pastas

| Destino | Critério |
|---------|----------|
| `src/shared/value-objects/<kebab>/` | Conceito genérico reutilizado por vários módulos ou infra (documento, contato, data UTC, senha, UUID, paginação) |
| `src/app/<modulo>/domain/value-objects/<kebab>.vo.ts` | Conceito específico do domínio de um módulo (ex.: combinação status + roles de conta) |

Arquivos na pasta shared (um diretório por conceito):

- `<kebab>.vo.ts` — classe do value object
- `<kebab>.error.ts` — erros de validação (skill `creating-custom-errors`)
- `<kebab>.vo.spec.ts` — testes (skill `writing-unit-tests`)

**Sem** barrel `index.ts` na pasta do VO.

## Modificadores de acesso

**Obrigatório:** cada método, getter, setter e atributo declara `public`, `private` ou `protected` — inclusive membros públicos.

**Exceção:** `constructor` **público** não leva modificador `public` (fica `constructor(...)`). Use `private constructor` quando a criação passa por factory estática (`create`, `from`).

Estado interno do valor: sempre `private readonly` (ex.: `private readonly _value: string`).

## Templates

Estilo alinhado ao ESLint do projeto: indent 2, aspas simples, `semi`, vírgula final em multiline, `else` em nova linha.

Escolha **um** template conforme o caso.

### A — Validação simples (entrada já normalizada ou sem máscara)

```ts
import { InvalidPhoneError } from './phone.error';

export class Phone {
  private readonly _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(phone: string) {
    if (!this.validate(phone)) {
      throw new InvalidPhoneError();
    }
    this._value = this.sanitize(phone);
  }

  private validate(phone: string): boolean {
    if (!phone) return false;

    const length = this.sanitize(phone).length;

    return length === 10 || length === 11;
  }

  private sanitize(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}
```

### B — Sanitização + constantes de regra

Ordem no construtor: `sanitize` → `validate` → atribuir valor **normalizado** a `_value`.

```ts
import { InvalidZipCodeError } from './zip-code.error';

export class ZipCode {
  private readonly FORMAT = /^\d{8}$/;
  private readonly _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(raw: string) {
    const zipCode = this.sanitize(raw);

    if (!this.validate(zipCode)) {
      throw new InvalidZipCodeError(raw);
    }

    this._value = zipCode;
  }

  private sanitize(zipCode: string): string {
    return typeof zipCode === 'string' ? zipCode.replace(/[\s.-]/g, '') : '';
  }

  private validate(zipCode: string): boolean {
    if (!zipCode) return false;

    return this.FORMAT.test(zipCode);
  }
}
```

Para dígitos verificadores (CPF/CNPJ): constantes `LENGTH`, `FORMAT`, métodos `private allDigitsAreEqual`, `private calculateDigit`; comentário opcional com link da fonte do algoritmo.

### C — Geração ou factory estática

`public static` para pontos de entrada; `private constructor` quando a instância só pode ser criada por caminhos controlados.

**Gerado (sem parâmetro de entrada):**

```ts
export class UUID {
  private readonly _value: string;

  constructor() {
    this._value = this.generateUUID();
  }

  public get value(): string {
    return this._value;
  }

  private generateUUID(): string {
    return crypto.randomUUID();
  }
}
```

**Factory + valor interno tipado (ex.: data UTC):**

```ts
import { DateTime } from 'luxon';
import { InvalidDateError, InvalidDaysQuantityError } from './utc-date.error';

export class UTCDate {
  private readonly _value: DateTime;

  public static create(): UTCDate {
    return new UTCDate();
  }

  public static from(value: Date): UTCDate {
    return new UTCDate(DateTime.fromJSDate(value, { zone: 'utc' }));
  }

  private constructor(value?: DateTime) {
    if (value && !value.isValid) {
      throw new InvalidDateError();
    }
    this._value = value ?? DateTime.utc();
  }

  public get value(): Date {
    return this._value.toJSDate();
  }

  public addDays(days: number): UTCDate {
    if (!days || days <= 0 || Number.isNaN(days) || !Number.isInteger(days)) {
      throw new InvalidDaysQuantityError();
    }
    return new UTCDate(this._value.plus({ days }));
  }
}
```

Métodos que “alteram” o conceito retornam **nova instância**, nunca mutam `_value`.

**Parâmetro de construção com validação de argumento (ex.: código com expiração):**

```ts
import { randomInt } from 'crypto';
import { InvalidExpirationTimeError } from './code.error';

export class Code {
  private readonly SECONDS_IN_A_MINUTE = 60;
  private readonly MILISECONDS_IN_A_SECOND = 1000;
  private readonly _value: string;
  private readonly _expiresIn: number;

  public get value(): { code: string; expiresIn: number } {
    return {
      code: this._value,
      expiresIn: this._expiresIn,
    };
  }

  constructor(expirationTimeInMinutes: number) {
    if (expirationTimeInMinutes <= 0) {
      throw new InvalidExpirationTimeError();
    }

    this._value = this.generateCode();
    this._expiresIn = Date.now() + this.minutesToMiliseconds(expirationTimeInMinutes);
  }

  private minutesToMiliseconds(minutes: number): number {
    return minutes * this.SECONDS_IN_A_MINUTE * this.MILISECONDS_IN_A_SECOND;
  }

  private generateCode(): string {
    return Array.from({ length: 6 }, () => randomInt(0, 10)).join('');
  }
}
```

### D — Composto (delega a outros VOs)

O valor armazenado é o resultado validado dos VOs filhos; formato inválido lança erro do composto ou do filho conforme a regra.

```ts
import { CNPJ } from '../cnpj/cnpj.vo';
import { CPF } from '../cpf/cpf.vo';
import { InvalidDocumentError } from './document.error';

export class Document {
  private readonly CPF_LENGTH = 11;
  private readonly CNPJ_LENGTH = 14;
  private readonly _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(raw: string) {
    const document = this.sanitize(raw);

    if (document.length === this.CPF_LENGTH) {
      this._value = new CPF(document).value;
    }
    else if (document.length === this.CNPJ_LENGTH) {
      this._value = new CNPJ(document).value;
    }
    else {
      throw new InvalidDocumentError(raw);
    }
  }

  private sanitize(document: string): string {
    return document?.replace(/[\s./-]*/gim, '')?.toUpperCase();
  }
}
```

### E — Métodos estáticos utilitários (sem instância obrigatória)

Quando o conceito inclui operação sobre primitivo já persistido (ex.: comparar senha com hash):

```ts
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

export class Password {
  private readonly saltRounds = 10;
  private readonly _value: string;

  public static compare(plain: string, hash: string): boolean {
    return bcrypt.compareSync(plain, hash);
  }

  public static generateRandom(): string {
    return randomBytes(12).toString('base64url');
  }

  constructor(password: string) {
    this._value = this.hashPassword(password);
  }

  private hashPassword(password: string): string {
    const salt = this.generateSalt(this.saltRounds);
    return bcrypt.hashSync(password, salt);
  }

  private generateSalt(salt: number): string {
    return bcrypt.genSaltSync(salt);
  }

  public get value(): string {
    return this._value;
  }
}
```

## Regras de escrita

**Ordem dentro da classe:** constantes `private readonly` → campos `private readonly` → métodos `public static` → getters `public` → `constructor` → métodos `private`.

**Nomeação:**

- Classe: PascalCase; siglas em caixa alta quando aplicável (`CPF`, `CNPJ`, `UUID`, `UTCDate`)
- Pasta e arquivo: kebab-case + `.vo.ts` (`zip-code.vo.ts`)

**Valor:**

- Não expor `_value` fora da classe; leitura via `public get value()` (ou getters adicionais com nome de domínio, ex.: `public get isoString()`)
- Valor guardado é sempre o **normalizado** após sanitize

**Validação:**

- Entrada externa: tratar `null`, `undefined`, tipo errado, string vazia
- Falha: `throw` de classe que estende `AppException` (ver skill `creating-custom-errors`)
- Para VO inválido na construção: preferir `HttpStatus.BAD_REQUEST`

**Dependências:**

- Permitidas: libs de domínio do conceito (`luxon`, `bcrypt`, `crypto`)
- **Proibido:** decorators Nest (`@Injectable`), Swagger (`@ApiProperty`), imports de `src/app/*` services

**Comentários:** apenas algoritmo ou norma externa (Receita Federal, SERPRO, etc.).

## Fora do escopo

Esta skill **não** escreve sozinha:

| Artefato | Delegar a |
|----------|-----------|
| `<kebab>.error.ts` | Skill `creating-custom-errors` (local: ao lado do VO em `value-objects/<kebab>/`) |
| `<kebab>.vo.spec.ts` | Skill `writing-unit-tests` (**obrigatório** em cada entrega de VO novo) |
| Uso do VO em entidade, service, DTO, controller | Fora (sem skill) — tarefa separada, só se o usuário pedir |

## Checklist de entrega

Antes de responder ao usuário, confirmar **todos** os itens:

- [ ] Conceito justificado como VO (não entidade nem DTO puro)
- [ ] Pasta/arquivo na localização correta (shared vs módulo)
- [ ] Estado em `private readonly`; sem setter público
- [ ] Getter `public get value()` (ou equivalente documentado no VO)
- [ ] Sanitize antes de validate quando há normalização
- [ ] Construção lança erro `AppException` quando inválido
- [ ] Métodos de “mudança” retornam nova instância
- [ ] Modificador explícito em todo membro, exceto `constructor` público sem `public`
- [ ] Sem decorators ou dependências de framework Nest no `.vo.ts`
- [ ] `<kebab>.error.ts` existe na pasta do VO **quando aplicável** (o `.vo.ts` lança `AppException` na validação/construção): criado via skill `creating-custom-errors`, uma classe por arquivo, `HttpStatus` explícito
- [ ] `<kebab>.vo.spec.ts` existe ao lado do VO: escrito **obrigatoriamente** com a skill `writing-unit-tests` (não improvisar formato de teste)
- [ ] Suíte do `<kebab>.vo.spec.ts` executada e passando
- [ ] Nenhum padrão copiado de outros VOs do repositório — apenas esta skill
