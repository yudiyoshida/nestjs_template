---
name: creating-persistence-ports
description: Cria as portas de persistência do módulo (IXxxDao e, no módulo rico, IXxxRepository) e a chave em TOKENS. Use quando o usuário pedir para criar porta de DAO, porta de repository, interface de persistência, IXxxDao, IXxxRepository ou token de DAO ou repository.
---

# Portas de persistência

Cria a interface `IXxxDao` e, no módulo rico, `IXxxRepository`, e registra a chave em `TOKENS`.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de porta de persistência.** Todo o padrão — escolha entre DAO anêmico e par DAO rico + repository, assinaturas, `null` em `findById`, tupla da lista, delete físico, token, import absoluto, método de dado sensível — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia arquivos existentes para copiar formato
- rode grep/glob para inferir convenção

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada
- arquivo que exporta `TOKENS` — só para inserir ou reusar (seção "Bloco base")

Exceção: usuário apontar um arquivo, ou pedir edição de uma porta que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar anêmico (só IXxxDao com escrita) ou rico (IXxxDao só leitura + IXxxRepository)
- [ ] 2. Localizar TOKENS pelo export (ausente → seção "Bloco base")
- [ ] 3. Escrever seguindo o template
- [ ] 4. Checklist de entrega
```

No passo 3, porta nova sai do template. Edição de porta que já existe: alterar só o que o pedido pede, no arquivo indicado.

## Quando usar

| Sintoma | Ação |
|---------|------|
| CRUD sem invariante que o objeto precise proteger, ou módulo interno sem agregado | Template "DAO anêmico" e chave `XxxDao` |
| Estado inválido não pode existir (entidade + factory) | Template "DAO rico" + template "Repository" e chaves `XxxDao` e `XxxRepository` |
| Pedido nomeia `IXxxDao`, `IXxxRepository`, interface de DAO ou de repository | Template da porta nomeada |
| Pedido pede leitura de senha, token ou documento | Acrescentar o método da seção "Dado sensível" em `IXxxDao` |
| `TOKENS` sem a chave do módulo | Inserir a chave da seção "Token" |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Classe de DTO, InputDto, QueryDto ou `WithSensitiveData` | Skill `creating-application-dtos` |
| Entidade | Skill `creating-domain-entity` |
| Use case e `@Inject` da porta | Skill `creating-use-case` |
| Erro `NotFound` | Skill `creating-custom-errors` |
| Adapter Prisma, `select`, `mapToDto` | Skill `implementing-prisma-adapters` |
| `XxxPersistenceModule`, `provide`, `exports` | Skill `creating-persistence-module` |
| Model Prisma | Skill `writing-prisma-model` |
| Gateway de vendor (Redis, SMTP, S3, CEP, CNPJ) | Skill `using-ports-and-adapters` |
| Spec de use case | Skills `writing-unit-tests` e `writing-integration-tests` |
| Spec de adapter Prisma | Skill `writing-integration-tests`. Sem spec unitário |
| Controller | Skill `creating-controllers` |

## Lei

- `findAll` devolve `Promise<[Dto[], number]>`.
- `findById` devolve `null` quando o registro não existe. Quem lança `NotFound` é o use case.
- Delete físico. Anêmico: `dao.delete(id)`. Rico: `repository.delete(id)`. Sem soft delete.
- Token `Symbol.for('XxxDao')` e `Symbol.for('XxxRepository')`. Nome da chave sem `I`. A string do `Symbol.for` é igual à chave.
- Import absoluto `src/...`.
- Leitura de senha, token ou documento: método próprio em `IXxxDao`, retorno `XxxWithSensitiveDataDto`. `XxxDto` de `findAll` e de `findById` fica sem esses campos. O `select` fica na skill `implementing-prisma-adapters`.
- Módulo anêmico leva só `IXxxDao`.
- DAO do módulo rico leva `findAll` e `findById`.
- `IXxxRepository` existe no módulo rico. `save` devolve `Promise<void>`: o id já nasce na factory.
- `save` do DAO anêmico devolve `Promise<string>`.
- A interface não importa Prisma nem Nest e não tem regra de negócio.
- A interface não tem spec.

Nomes:

| Peça | Forma |
|------|--------|
| Pasta do módulo | kebab, singular (`faq`, `tip`) |
| `Xxx` | mesmo nome em PascalCase (`Faq`, `Tip`) |
| Interface | `IXxxDao`, `IXxxRepository` |
| Arquivo do DAO | `src/app/<modulo>/application/persistence/dao/<modulo>-dao.interface.ts` |
| Arquivo do repository | `src/app/<modulo>/application/persistence/repository/<modulo>-repository.interface.ts` |
| Chave | `XxxDao`, `XxxRepository` |

Parâmetro de lista: `query`.

## Bloco base

Localizar `TOKENS` antes de escrever. Se o arquivo existir, inserir só a chave que falta (seção "Token"). Se não existir, criar o arquivo abaixo e em seguida inserir a chave nova.

| Símbolo | Localizar por | Destino se ausente |
|---------|---------------|--------------------|
| `TOKENS` | `export { TOKENS }` | `src/core/di/token.ts` |

```bash
grep -rn "export { TOKENS }" src
```

```ts
const TOKENS = {
  CacheGateway: Symbol.for('CacheGateway'),
  CepLookupGateway: Symbol.for('CepLookupGateway'),
  CnpjLookupGateway: Symbol.for('CnpjLookupGateway'),
  LoggerGateway: Symbol.for('LoggerGateway'),
  SmtpGateway: Symbol.for('SmtpGateway'),
  UploadFileGateway: Symbol.for('UploadFileGateway'),

  AccountDao: Symbol.for('AccountDao'),
};

export { TOKENS };
```

## Templates

Substitua `<modulo>` pelo kebab singular e `Xxx` pelo PascalCase. Import de DTO e de entidade: trocar pelo caminho real do arquivo que exporta o símbolo. O caminho no template é o destino quando esse arquivo ainda vai nascer.

### DAO anêmico

`src/app/<modulo>/application/persistence/dao/<modulo>-dao.interface.ts`

```ts
import { XxxDto } from 'src/app/<modulo>/application/dtos/<modulo>.dto';
import { CreateXxxInputDto } from 'src/app/<modulo>/application/usecases/create-<modulo>/dtos/create-<modulo>.dto';
import { EditXxxInputDto } from 'src/app/<modulo>/application/usecases/edit-<modulo>/dtos/edit-<modulo>.dto';
import { FindAllXxxQueryDto } from 'src/app/<modulo>/application/usecases/find-all-<modulo>/dtos/find-all-<modulo>.dto';

export interface IXxxDao {
  findAll(query: FindAllXxxQueryDto): Promise<[XxxDto[], number]>;
  findById(id: string): Promise<XxxDto | null>;
  save(data: CreateXxxInputDto): Promise<string>;
  edit(id: string, data: EditXxxInputDto): Promise<void>;
  delete(id: string): Promise<void>;
}
```

`save` e `edit` recebem InputDto.

### DAO rico

`src/app/<modulo>/application/persistence/dao/<modulo>-dao.interface.ts`

```ts
import { XxxDto } from 'src/app/<modulo>/application/dtos/<modulo>.dto';
import { FindAllXxxQueryDto } from 'src/app/<modulo>/application/usecases/find-all-<modulo>/dtos/find-all-<modulo>.dto';

export interface IXxxDao {
  findAll(query: FindAllXxxQueryDto): Promise<[XxxDto[], number]>;
  findById(id: string): Promise<XxxDto | null>;
}
```

### Repository

`src/app/<modulo>/application/persistence/repository/<modulo>-repository.interface.ts`

```ts
import { Xxx } from 'src/app/<modulo>/domain/entities/<modulo>.entity';

export interface IXxxRepository {
  save(entity: Xxx): Promise<void>;
  edit(entity: Xxx): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Xxx | null>;
}
```

`save` e `edit` recebem a entidade.

### Dado sensível

Só quando o pedido pede senha, token ou documento. O método entra em `IXxxDao` (anêmico ou rico), além dos métodos do template.

```ts
import { XxxWithSensitiveDataDto } from 'src/app/<modulo>/application/dtos/<modulo>.dto';

findByIdWithSensitiveData(id: string): Promise<XxxWithSensitiveDataDto | null>;
```

A classe `XxxWithSensitiveDataDto` mora no mesmo arquivo do read model e nasce na skill `creating-application-dtos`.

### Token

Inserir dentro do objeto `TOKENS`. Chave já presente permanece como está.

Anêmico:

```ts
  XxxDao: Symbol.for('XxxDao'),
```

Rico, as duas:

```ts
  XxxDao: Symbol.for('XxxDao'),
  XxxRepository: Symbol.for('XxxRepository'),
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| DTO, InputDto, QueryDto, `XxxWithSensitiveDataDto` | Skill `creating-application-dtos` |
| Entidade | Skill `creating-domain-entity` |
| Use case e `@Inject` | Skill `creating-use-case` |
| Erro `NotFound` | Skill `creating-custom-errors` |
| Adapter Prisma | Skill `implementing-prisma-adapters` |
| `XxxPersistenceModule` | Skill `creating-persistence-module` |
| Model Prisma | Skill `writing-prisma-model` |
| Gateway de vendor | Skill `using-ports-and-adapters` |
| Spec de use case | Skills `writing-unit-tests` e `writing-integration-tests` |
| Spec de adapter Prisma | Skill `writing-integration-tests`. Sem spec unitário |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Anêmico: só `IXxxDao` com `findAll`, `findById`, `save`, `edit`, `delete`
- [ ] Rico: `IXxxDao` com `findAll` e `findById`, mais `IXxxRepository`
- [ ] `findAll` devolve `Promise<[Dto[], number]>` e o parâmetro se chama `query`
- [ ] `findById` devolve `null`
- [ ] DAO anêmico: `save` devolve `Promise<string>`; `edit` e `delete` devolvem `Promise<void>`
- [ ] Repository: `save` e `edit` recebem a entidade e devolvem `Promise<void>`; `delete(id)` devolve `Promise<void>`
- [ ] Delete físico, sem soft delete
- [ ] Chave em `TOKENS` com `Symbol.for` igual ao nome, sem prefixo `I`
- [ ] Imports absolutos `src/...`
- [ ] Interface sem Prisma, sem Nest e sem regra de negócio
- [ ] Dado sensível só no método `findByIdWithSensitiveData`, e só se o pedido pediu
- [ ] DTO, entidade, use case, erro, adapter, module, model, gateway e spec não foram criados aqui
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
