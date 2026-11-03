---
name: creating-domain-enum
description: Cria o enum de domínio com valor explícito SCREAMING_SNAKE, persistido como String. Use quando o usuário pedir para criar enum, status, tipo ou discriminador de domínio.
---

# Enum de domínio

A skill produz um `export enum` de conjunto fechado de rótulos, com o nome do membro igual à string.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de enum.** Todo o padrão — `export enum`, valor `SCREAMING_SNAKE` igual ao membro, um conceito por arquivo, coluna `String` no Prisma — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia arquivos existentes para copiar formato
- rode grep/glob para inferir convenção
- abra outra skill para copiar seções ou a forma do enum

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada

Exceção: usuário apontar um arquivo, ou pedir edição de um arquivo que já existe — leia só esse arquivo.

Esta skill não tem bloco base. O arquivo não depende de símbolo compartilhado.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar conjunto fechado de rótulos. Conceito com coluna própria ou relação: parar, sem enum
- [ ] 2. Escrever o enum pelo template. Trocar ExampleStatus e os membros pelo pedido
- [ ] 3. Checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Pedido de enum, status, tipo ou discriminador com rótulos fechados | Escrever `src/app/<modulo>/domain/enums/<nome>.enum.ts` |

`<modulo>` é o kebab singular da pasta. `<nome>` é o kebab do conceito, não obrigatoriamente o nome do módulo. O exemplo abaixo usa `example-status.enum.ts` e `ExampleStatus`. Um conceito por arquivo.

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Conceito com coluna própria ou relação (`Role`, `Admin`) | Tabela. Skill `writing-prisma-model`. Sem este enum |
| Forma da entidade ou transição de status | Skill `creating-domain-entity` |
| `create*` que fixa o membro inicial | Skill `creating-domain-factory` |
| Classe do erro | Skill `creating-custom-errors` |
| Formato reutilizável (CPF, e-mail, data) | Skill `creating-value-objects` |
| Model Prisma e coluna `String` | Skill `writing-prisma-model` |
| `@IsEnum` no DTO | Skill `creating-application-dtos` |
| Spec de quem compara o membro | Skill `writing-unit-tests` |

## Lei

- O arquivo exporta `enum`. O nome do membro e a string são o mesmo `SCREAMING_SNAKE`: `ACTIVE = 'ACTIVE'`, `ADMIN = 'ADMIN'`.
- Proibido valor `'Active'`, `'Ativo'`, número, rótulo com espaço ou minúscula.
- Proibido união de strings no lugar do enum. Proibido `const enum`.
- O arquivo não tem import. Não importa Nest nem Prisma.
- A coluna que persiste o valor é `String`. Proibido `enum` nativo do Prisma para status ou tipo simples. O model não nasce aqui.
- Conceito com coluna própria ou relação (`Role`, `Admin`) é tabela, não este arquivo.
- O enum não tem ramo. Esta skill não gera `*.spec.ts`. Quem usa o membro cobre o comportamento no spec da entidade ou da factory.

## Templates

`ExampleStatus`, `ACTIVE` e `EXPIRED` são do exemplo. O pedido troca o nome e os membros. A forma permanece.

Destino: `src/app/<modulo>/domain/enums/<nome>.enum.ts`.

```ts
export enum ExampleStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
}
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Entidade que compara o membro | Skill `creating-domain-entity` |
| Factory que atribui o membro no `create*` | Skill `creating-domain-factory` |
| Classe de erro | Skill `creating-custom-errors` |
| Value object | Skill `creating-value-objects` |
| `prisma/schema/<modelo>.prisma` com coluna `String` | Skill `writing-prisma-model` |
| `@IsEnum` no DTO | Skill `creating-application-dtos` |
| Spec de quem usa o membro | Skill `writing-unit-tests` |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Arquivo em `src/app/<modulo>/domain/enums/<nome>.enum.ts`, um conceito
- [ ] `export enum` com membro e string iguais, em `SCREAMING_SNAKE`
- [ ] Sem `'Active'`, `'Ativo'`, número, união de strings ou `const enum`
- [ ] Sem import, sem Nest, sem Prisma neste arquivo
- [ ] Coluna de persistência fica como `String` na skill `writing-prisma-model`
- [ ] Conceito com coluna própria ou relação não virou enum
- [ ] Sem `*.spec.ts` deste arquivo
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
