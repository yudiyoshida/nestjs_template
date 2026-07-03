---
name: domain-modeling
description: >-
  Modelagem de domínio DDD-light no nestjs_template. Use ao criar entidades ricas,
  factories, value objects, enums de domínio, ou decidir se precisa de entity.
---

# Modelagem de Domínio

## Contexto

DDD-light aplica-se a módulos com **regra de negócio rica**. CRUD simples não tem entidade — só DTO + erros. Referência DDD: `src/app/_examples/tip/`.

## Quando Usar Entity

| Cenário | Usar Entity? |
|---|---|
| CRUD simples (FAQ) | Não — só DTO + erros |
| Regras de negócio (status, expiração, edição condicional) | Sim — entity + factory + repository |

## Entity

```typescript
export type TipProps = TipCreateProps & {
  id: string;
  type: TipType;
  status: TipStatus;
  expiresAt: Date | null;
};

export type TipCreateProps = {
  title: string;
  content: string;
  locationId: string | null;
  createdBy: string;
};

export class Tip {
  private readonly _props: TipProps;

  static _instantiate(props: TipProps): Tip {
    return new Tip(props);
  }

  private constructor(props: TipProps) { this._props = props; }

  public get props(): Readonly<TipProps> {
    return { ...this._props };
  }

  public isActive(): boolean {
    return this._props.status === TipStatus.ACTIVE;
  }
}
```

Obrigatório:
- Construtor `private`
- `_instantiate` static
- `props` retorna **cópia** (`{ ...this._props }`)
- Métodos de negócio mutam `_props` internamente
- Invariantes lançam erros tipados de `domain/errors/`

## Factory

```typescript
export class TipFactory {
  static create(props: TipCreateProps, type: TipType): Tip { /* valida + instancia */ }
  static edit(entity: Tip, props: Partial<TipCreateProps>): Tip { /* valida + retorna nova instância */ }
  static load(props: TipProps): Tip { return Tip._instantiate(props); }
}
```

- `create` — criação com validação de invariantes
- `edit` — edição com validação
- `load` — reidratação a partir de dados persistidos (usado pelo Repository)

## Enums

Armazenados como `String` no Prisma, cast para enum TS no DAO/Repository:

```typescript
export enum TipStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REMOVED = 'REMOVED',
}
```

## Anti-Padrões

- ❌ Entity em CRUD simples
- ❌ `@nestjs/*` ou `@prisma/*` em `domain/`
- ❌ Instanciar entidade direto no Repository (usar `Factory.load`)
- ❌ `props` retornando referência direta
