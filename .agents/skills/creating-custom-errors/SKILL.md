---
name: creating-custom-errors
description: Cria e padroniza classes de erro da aplicação que estendem AppException, decidindo entre erro global (src/shared/errors) e erro de módulo (domain/errors ou application/errors). Use quando o usuário pedir para criar, adicionar, padronizar ou revisar um erro customizado, exceção de domínio, erro de regra de negócio ou erro de value object.
---

# Creating Custom Errors

Padroniza erros da aplicação estendendo `AppException`, com localização por camada e status HTTP explícito via `HttpStatus`.

## Esta skill é a única fonte da verdade

**Proibido consultar outros erros do projeto para descobrir o formato.** Todo o padrão — base `AppException`, localização, template, nomeação, mensagens e status HTTP — está definido aqui e apenas aqui.

Ler erros existentes é **obrigatório** no passo 1, mas só para achar semântica equivalente e reusar (seção "Reuso antes de criar") — nunca para copiar formato. Se um erro existente contradiz esta skill, **esta skill vence**.

Exceção: usuário apontar um arquivo como referência, ou pedir edição de um erro que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Procurar erro equivalente já existente (reusar antes de criar)
- [ ] 2. Decidir localização do arquivo
- [ ] 3. Escrever o arquivo seguindo o template obrigatório
- [ ] 4. Rodar o checklist de entrega
```

## Quando usar

Toda falha esperada que o cliente da API precisa receber como `{ message }` com status HTTP: regra de negócio, recurso não encontrado, unicidade, credencial ou permissão, value object inválido, falha de integração externa. A seção "Status HTTP" mapeia cada caso.

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Erro equivalente já existe | Reusar (seção "Reuso antes de criar") |
| Formato de body, query ou params inválido | Fora (sem skill) — DTO + `class-validator`; o `ValidationPipe` já responde 400 |
| Falha de vendor dentro de adapter de infra | Reusar `ExternalApiError`; adapter via skill `using-ports-and-adapters` |

## Estrutura de pastas

| Destino | Critério |
|---------|----------|
| `src/shared/errors/<kebab>.error.ts` | Usado por 2+ módulos, ou falha de integração/infra reutilizável (ex.: API externa, unicidade de e-mail/documento). |
| `src/app/<modulo>/domain/errors/<kebab>.error.ts` | Regra de negócio, entidade de domínio, estado inválido da entidade, recurso do módulo não encontrado (ex.: `ProductNotFoundError`, `ProductCannotBeEditedError` — módulo fictício `product`). |
| `src/app/<modulo>/application/errors/<kebab>.error.ts` | Falha de orquestração na camada de aplicação: credencial, refresh token, conta inativa, permissão no fluxo de auth (ex.: `InvalidCredentialError`, `ForbiddenAccountError`). |
| `src/shared/value-objects/<vo>/<vo>.error.ts` | Erro disparado **apenas** na construção/validação desse value object (ex.: `InvalidCnpjError` em `cnpj.error.ts`). |

Uma classe por arquivo. Arquivos legados com múltiplas classes (ex.: `utc-date.error.ts`) não precisam ser divididos por esta skill — **novos** erros seguem uma classe por arquivo.

## Nomeação

- **Classe:** PascalCase, sufixo `Error` (ex.: `InvalidCredentialError`, `InvalidCpfError`).
- **Arquivo:** kebab-case + sufixo `.error.ts` (ex.: `invalid-credential.error.ts`, `forbidden-account.error.ts`).
- **`this.name`:** string idêntica ao nome da classe.

## Templates

Sem parâmetros:

```ts
import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class InvalidCredentialError extends AppException {
  constructor() {
    super('Credenciais inválidas.', HttpStatus.BAD_REQUEST);
    this.name = 'InvalidCredentialError';
  }
}
```

Com parâmetro para interpolar identificador ou valor na mensagem:

```ts
import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class EmailAlreadyTakenError extends AppException {
  constructor(email: string) {
    super(`O e-mail ${email} já está em uso.`, HttpStatus.CONFLICT);
    this.name = 'EmailAlreadyTakenError';
  }
}
```

Ordem no `constructor`: `super(message, HttpStatus.…)` → `this.name = 'NomeDaClasse'`.

## Regra base

Todo erro customizado **estende** `AppException` importado de `src/core/filters/app.exception`.

**Proibido:** `Error` nativo, `HttpException`, `NotFoundException` ou outras exceções do Nest usadas como erro de domínio/aplicação.

O `HttpExceptionFilter` (`src/core/filters/http-exception/http-exception.filter.ts`) captura `AppException`, registra o erro e responde ao cliente com JSON `{ message }` e status HTTP igual a `exception.code` (ou `400` se `code` não foi definido).

## Reuso antes de criar

O objetivo é **centralizar** erros. Antes de criar um arquivo novo:

1. Buscar em `src/shared/errors/` por erro com a mesma semântica.
2. Buscar em `src/app/<modulo>/domain/errors/` e `src/app/<modulo>/application/errors/` do módulo alvo.
3. Para validação de VO, verificar se já existe `<vo>.error.ts` ao lado do value object em `src/shared/value-objects/<vo>/`.

**Se já existe** um erro equivalente (mesma regra, mesmo status, mesma mensagem para o cliente): **reusar** e informar o usuário. Não duplicar.

**Promoção:** se um erro de módulo passa a ser usado por um segundo módulo (ou por `src/infra/`), mover/promover para `src/shared/errors/` e atualizar imports — só quando o usuário pedir refatoração; ao criar novo erro compartilhado, colocar direto em `shared`.

Exemplos de erros globais existentes: `EmailAlreadyTakenError`, `DocumentAlreadyTakenError`, `ExternalApiError`.

## Mensagens

- Idioma: **pt-BR**.
- Frase completa voltada ao consumidor da API, com **ponto final**.
- **Não incluir:** stack trace, SQL, nome de tabela/coluna, senha, token, hash ou qualquer dado sensível.
- Interpolar identificador (id, e-mail, documento) só quando ajuda quem chama a corrigir o request.

## Status HTTP

Sempre passar status explícito com `HttpStatus` de `@nestjs/common` (nunca número literal solto como `404` em erros novos).

| `HttpStatus` | Quando usar |
|--------------|-------------|
| `BAD_REQUEST` | Validação de entrada, VO inválido, credencial malformada no login. |
| `UNAUTHORIZED` | Token de atualização inválido ou expirado. |
| `FORBIDDEN` | Conta suspensa, acesso negado por role/permissão. |
| `NOT_FOUND` | Recurso inexistente na base de dados. |
| `CONFLICT` | Unicidade (e-mail, documento já em uso). |
| `UNPROCESSABLE_ENTITY` | Regra de negócio com dados válidos mas operação não permitida (ex.: entidade expirada não pode ser editada). |
| `SERVICE_UNAVAILABLE` | Falha de integração externa (referência: `ExternalApiError`). |

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| `throw new …` em services, entidades ou gateways | Fora (sem skill) — tarefa separada, só com pedido do usuário |
| Flags `@Swagger` no controller (`applyNotFound`, `applyConflict`, `applyForbidden`, etc.) | Fora (sem skill; planejada using-swagger-decorator) |
| Testes unitários | Skill `writing-unit-tests` — tarefa separada, só com pedido do usuário |
| Testes de integração | Skill `writing-integration-tests` — tarefa separada, só com pedido do usuário |

## Checklist de entrega

Antes de responder ao usuário, confirmar **todos** os itens:

- [ ] Classe estende `AppException`
- [ ] Import de `HttpStatus` de `@nestjs/common`
- [ ] `this.name` igual ao nome da classe
- [ ] Status HTTP explícito via `HttpStatus.*`
- [ ] Mensagem em pt-BR, sem dado sensível
- [ ] Arquivo `<kebab>.error.ts` na camada/pasta correta
- [ ] Uma classe por arquivo (erro novo)
- [ ] Não existe erro equivalente duplicado; reuso ou promoção tratados em "Reuso antes de criar"
- [ ] Nenhum formato copiado de outro erro do repositório — apenas esta skill
