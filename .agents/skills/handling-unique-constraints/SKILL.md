---
name: handling-unique-constraints
description: Faz campo único responder 409 em vez de 500 — checagem prévia no use case pela porta, com o valor já normalizado, erro de conflito do campo e flag applyConflict na rota. Use quando o usuário pedir campo único, valor que não pode repetir, e-mail ou documento já em uso, conflito 409, tratar unique ou @unique, ou handling-unique-constraints.
---

# Campo único

Garante que valor repetido num campo `@unique` vire erro 409 com mensagem, checado no use case antes de gravar.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de unicidade.** Todo o padrão — onde checar, a porta `existsBy<Campo>`, a consulta no adapter, a ordem no create e no edit, o erro 409, a flag do Swagger e o que fica de fora — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia outro módulo para copiar formato
- rode grep/glob para inferir convenção
- abra skill vizinha para aprender seção ou template

Se código existente contradiz esta skill, **esta skill vence** no trecho novo.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada
- o model, a porta, o adapter, os use cases de create e edit e o controller do módulo — só para inserir o trecho
- o arquivo que exporta o erro de conflito (seção "Bloco base") — só para reusar

Exceção: usuário apontar um arquivo — leia só esse arquivo.

### Leis

- A checagem é prévia, no use case, pela porta: `existsBy<Campo>`. Valor já usado: lança o erro 409 do campo e não grava.
- A coluna continua `@unique` no model. Ela é a última barreira.
- Corrida entre duas gravações simultâneas passa pela checagem e esbarra no `@unique`: a segunda sai como 500. É a escolha do template: sem tradução do `P2002` do Prisma.
- O valor checado é o valor gravado. Campo com formato passa pelo VO antes da checagem (`new Email(data.email).value`).
- Create: VO, checagem, gravação, nessa ordem.
- Edit: checa só quando o campo veio e mudou em relação ao registro já carregado. Campo ausente ou valor igual: sem consulta.
- Use case com efeito irreversível antes de gravar (upload, e-mail, chamada externa) checa antes do efeito.
- Porta: anêmico, `IXxxDao`; rico, `IXxxRepository`, porque comando rico não usa DAO. Módulo interno segue o formato da persistência dele.
- `existsBy<Campo>(valor): Promise<boolean>`, um método por campo único. Sem `ignoreId`: o edit compara com o registro que já carregou.
- Adapter: `findUnique` pelo campo, com `select: { id: true }`, e devolve `row !== null`. Sem regra no adapter.
- Erro 409: e-mail reusa `EmailAlreadyTakenError` e documento reusa `DocumentAlreadyTakenError`, de `src/shared/errors`. Outro campo: erro do módulo em `domain/errors/`, criado pela skill `creating-custom-errors` com `HttpStatus.CONFLICT`.
- Controller: `applyConflict: true` no `Swagger` de cada rota que pode lançar o 409: o create e, quando o campo é editável, o edit.
- Unicidade composta (`@@unique([a, b])`) fica fora desta skill.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar o campo único e o formato do módulo (anêmico, rico ou interno)
- [ ] 2. Conferir o @unique da coluna (ausente → writing-prisma-model ou evolving-existing-module)
- [ ] 3. Localizar o erro 409 do campo (ausente → creating-custom-errors)
- [ ] 4. existsBy<Campo> na porta e no adapter
- [ ] 5. Checagem no create e, se o campo é editável, no edit
- [ ] 6. applyConflict na rota que pode lançar o 409
- [ ] 7. inventorying-test-scenarios no use case e no adapter; depois as skills de spec
- [ ] 8. Checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Campo que não pode repetir (e-mail, documento, slug, código) | Fluxo inteiro |
| Create que responde 500 quando o valor já existe | Fluxo inteiro |
| Campo que passou a ser editável e é único | Passos 4 a 7, só a parte do edit |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Coluna nova ou `@unique` no model | Skill `writing-prisma-model` ou `evolving-existing-module` |
| Classe do erro de conflito que não existe | Skill `creating-custom-errors` |
| Unicidade composta (`@@unique([a, b])`) | Fora (sem skill) |
| Traduzir o `P2002` do Prisma no adapter | Fora (sem skill): decisão do template |

## Bloco base

Localizar pelo export antes de escrever. Existe: reusar. Ausente: a skill `creating-custom-errors` cria no destino indicado.

| Símbolo | Localizar por | Destino se ausente |
|---------|---------------|--------------------|
| `EmailAlreadyTakenError` | `export class EmailAlreadyTakenError` | `src/shared/errors/email-already-taken.error.ts`, pela skill `creating-custom-errors` |
| `DocumentAlreadyTakenError` | `export class DocumentAlreadyTakenError` | `src/shared/errors/document-already-taken.error.ts`, pela skill `creating-custom-errors` |

```bash
grep -rn "export class EmailAlreadyTakenError" src
grep -rn "export class DocumentAlreadyTakenError" src
```

Os dois respondem `HttpStatus.CONFLICT`. `EmailAlreadyTakenError(email)` põe o e-mail na mensagem. `DocumentAlreadyTakenError()` não recebe o documento: CPF e CNPJ não entram em mensagem, que o filter grava em `logs/http.log`. Erro de outro campo, no módulo, segue o do e-mail quando o valor não é sensível (`XxxSlugAlreadyTakenError(slug)` em `domain/errors/xxx-slug-already-taken.error.ts`) e o do documento quando é.

## Templates

`Xxx`, `email` e `Email` são do exemplo. Trocar pelo módulo, pelo campo único e pelo VO dele. Campo sem formato: sem VO, o valor do DTO vai direto para a checagem.

### Porta

Anêmico em `IXxxDao`; rico em `IXxxRepository`.

```ts
existsByEmail(email: string): Promise<boolean>;
```

### Adapter

No adapter da porta: `XxxDaoAdapterPrisma` ou `XxxRepositoryAdapterPrisma`.

```ts
public async existsByEmail(email: string): Promise<boolean> {
  const row = await this.prisma.xxx.findUnique({
    where: { email },
    select: { id: true },
  });

  return row !== null;
}
```

### Create

Anêmico:

```ts
public async execute(data: CreateXxxInputDto): Promise<CreateXxxOutputDto> {
  const email = new Email(data.email).value;
  if (await this.xxxDao.existsByEmail(email)) {
    throw new EmailAlreadyTakenError(email);
  }

  const id = await this.xxxDao.save({
    name: data.name,
    email,
  });

  return { id };
}
```

Rico, no mesmo lugar do create:

```ts
const email = new Email(data.email).value;
if (await this.xxxRepository.existsByEmail(email)) {
  throw new EmailAlreadyTakenError(email);
}

const entity = XxxFactory.create({
  name: data.name,
  email,
  createdBy: actorId,
});
await this.xxxRepository.save(entity);
```

### Edit

Depois do `NotFound` e da checagem de dono. Anêmico:

```ts
const email = data.email !== undefined ? new Email(data.email).value : undefined;
if (email !== undefined && email !== current.email && await this.xxxDao.existsByEmail(email)) {
  throw new EmailAlreadyTakenError(email);
}

await this.xxxDao.edit(id, {
  name: data.name,
  email,
});
```

Rico:

```ts
const email = data.email !== undefined ? new Email(data.email).value : undefined;
if (email !== undefined && email !== entity.props.email && await this.xxxRepository.existsByEmail(email)) {
  throw new EmailAlreadyTakenError(email);
}

const edited = XxxFactory.edit(entity, data);
await this.xxxRepository.edit(edited);
```

### Controller

```ts
@Swagger({
  tags: ['Xxxs'],
  summary: 'Criar xxx',
  applyBadRequest: true,
  applyConflict: true,
  createdResponse: CreateXxxOutputDto,
})
```

### Cenários que o inventário cobre

- Use case: valor livre grava o valor normalizado; valor usado lança o 409 e não chama a gravação; edit sem o campo não consulta; edit com o mesmo valor não consulta.
- Adapter (integração): `true` com a linha gravada; `false` sem ela.

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| `@unique` e coluna no model | Skill `writing-prisma-model` |
| Erro de conflito novo | Skill `creating-custom-errors` |
| Value object do campo | Skill `creating-value-objects` |
| Specs | Skills `inventorying-test-scenarios`, `writing-unit-tests` e `writing-integration-tests` |
| Unicidade composta, tradução do `P2002` | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Coluna com `@unique` no model
- [ ] `existsBy<Campo>` na porta certa (DAO no anêmico, repository no rico) e no adapter, com `findUnique` e `select: { id: true }`
- [ ] Create: VO, checagem, gravação; valor checado igual ao gravado
- [ ] Edit: checa só quando o campo veio e mudou
- [ ] Erro 409 reusado de `src/shared/errors` ou criado no módulo por `creating-custom-errors`
- [ ] `applyConflict: true` em cada rota que pode lançar o 409
- [ ] Efeito irreversível do use case vem depois da checagem
- [ ] Sem tradução do `P2002` e sem `@@unique` composto
- [ ] `inventorying-test-scenarios` rodou no use case e no adapter; specs pelas skills de spec
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
