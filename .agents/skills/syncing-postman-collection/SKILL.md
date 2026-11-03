---
name: syncing-postman-collection
description: "Regera a collection Postman a partir do swagger com o comando npm run generate:postman. Use quando o usuário pedir para atualizar a collection, regenerar o Postman, sincronizar rotas do swagger na collection, acrescentar rota na collection, ou recriar o gerador ausente."
---

# Sincronizar a collection Postman

Produz `postman/api.postman_collection.json` a partir do swagger pelo comando `npm run generate:postman`.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão da collection Postman.** Todo o padrão — comando, entrada, saída, contrato e gerador — está definido nesta skill e em `references/gerador.md`.

Antes de escrever, **não**:

- leia arquivos existentes para copiar formato
- rode grep/glob para inferir convenção
- rode grep em `src/` para este artefato
- use arquivo de `postman/` como fonte do algoritmo

O artefato não é classe exportada de `src/`. A localização é a existência do arquivo `postman/swagger-to-postman.ts`.

Se a collection ou o comando contradizem esta skill, **esta skill vence**: o JSON gerado não se ajusta à mão e o comando permanece `npm run generate:postman`.

`postman/swagger-to-postman.ts` presente permanece. A skill não o reescreve. A recriação só ocorre quando o arquivo não existe, e o texto sai de `references/gerador.md`.

**Permitido ler apenas para executar a tarefa (não para formato):**

- `postman/swagger.json`, ou o arquivo apontado por `SWAGGER_PATH`, como entrada já presente
- checar se `postman/swagger-to-postman.ts` existe, sem abrir o conteúdo
- a chave `generate:postman` em `package.json`, só para repor o texto canônico se a chave sumir

Exceção: o usuário apontar um arquivo, ou pedir edição de um arquivo que já existe — a leitura fica só nesse arquivo. Mudar regra do gerador exige pedido explícito de mudar o gerador.

## Lei

A collection Postman não se edita à mão. Proibido editar `postman/api.postman_collection.json` para acrescentar rota, body, auth ou teste. Falha do comando não autoriza editar esse JSON.

O comando único é `npm run generate:postman`. O script dessa chave é exatamente `ts-node postman/swagger-to-postman.ts`. Se a chave sumir do `package.json`, esse texto se recria. Outro gerador, outra lib e outro script ficam de fora.

Entrada: `postman/swagger.json`, ou o caminho em `process.env.SWAGGER_PATH`. O script resolve `process.env.SWAGGER_PATH || path.join(__dirname, './swagger.json')`. Saída: `postman/api.postman_collection.json`.

Atualizar a entrada é pré-requisito: exportar ou substituir o JSON do swagger. A skill não cria exportador e não inventa script que grave `swagger.json`.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que o pedido é atualizar a collection a partir do swagger
- [ ] 2. Confirmar a entrada em postman/swagger.json ou SWAGGER_PATH. Sem o JSON no lugar, parar: a exportação ou a substituição é pré-requisito
- [ ] 3. Localizar postman/swagger-to-postman.ts pela existência do arquivo. Se o arquivo existe, não reescrever. Se não existe, leia `references/gerador.md` antes de recriar `postman/swagger-to-postman.ts`. Se a chave generate:postman sumir, recriar o texto ts-node postman/swagger-to-postman.ts
- [ ] 4. Rodar npm run generate:postman
- [ ] 5. Não abrir postman/api.postman_collection.json para editar
- [ ] 6. Checklist de entrega
```

## Contrato

A implementação mora em `references/gerador.md`. A recriação copia o bloco `ts` desse arquivo. Este resumo não autoriza gerador diferente.

- Collection Postman v2.1 (`https://schema.getpostman.com/json/collection/v2.1.0/collection.json`).
- Nome da collection: `info.title` do swagger, ou `api`. Descrição: `info.description`, ou `API REST - Postman Collection`.
- Pasta pela primeira tag da operação; sem tag → `Outros`.
- Métodos: get, post, put, patch, delete.
- URL `{{baseUrl}}` + path. Path param `{nome}` vira `{{nome}}`.
- Query vira variável `{{nome}}`, description `Obrigatório` ou `Opcional`.
- Body JSON a partir do example do schema ou dos examples das properties; senão `{}`. Property sem example entra como `''`, `0`, `false` ou `[]` quando o type é string, number, boolean ou array.
- `event` é irmão de `request`, não filho (spec v2.1).
- POST `/auth/login` e POST `/auth/refresh`: auth `noauth` + script de test que grava `accessToken` e `refreshToken` nas variáveis da collection se vierem no JSON.
- No refresh, se houver body, força `refreshToken: "{{refreshToken}}"`.
- POST `/auth/logout`: auth bearer e script que, em HTTP 200, zera `accessToken` e `refreshToken`.
- Demais operações com `security` contendo chave `bearer`: auth bearer `{{accessToken}}`.
- Auth da collection: bearer `{{accessToken}}`.
- Variáveis: `baseUrl` = `http://localhost:3000`, `accessToken` = `''`, `refreshToken` = `''`.
- Nome do item: `summary` || `operationId` || `METHOD path`.
- Header `Content-Type: application/json`.
- Body raw só em post, put, patch quando há body.

## Quando usar

| Sintoma | Ação |
|---------|------|
| Atualizar, regenerar ou sincronizar a collection | Rodar `npm run generate:postman` |
| Acrescentar rota, body, auth ou teste na collection | Rodar o comando único; o JSON gerado permanece intocado |
| `postman/swagger-to-postman.ts` ausente | Recriar a partir de `references/gerador.md` e garantir o script npm |
| Chave `generate:postman` ausente no `package.json` | Recriar o texto `ts-node postman/swagger-to-postman.ts` |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Documentar endpoint no Swagger do controller | Skill `creating-controllers` (helper `Swagger`) |
| Mock de API, monitor Postman, teste de collection | Fora (sem skill) |
| Editar o JSON da collection à mão | Proibido; rodar `npm run generate:postman` |

## Templates

O script TypeScript completo está no bloco `ts` de `references/gerador.md`. Esse bloco recria `postman/swagger-to-postman.ts` quando o arquivo não existe. No passo 3 do fluxo, leia `references/gerador.md` antes de recriar `postman/swagger-to-postman.ts`.

Chave npm, texto exato, quando a chave sumir:

```json
"generate:postman": "ts-node postman/swagger-to-postman.ts"
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Novo gerador, outra biblioteca ou outro script | O comando único permanece |
| Exportador que grave `swagger.json` | Fora (sem skill) |
| Alterar regra de auth, body ou pasta do gerador sem pedido explícito de mudar o gerador | Fora |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Comando único foi `npm run generate:postman`, com script `ts-node postman/swagger-to-postman.ts`
- [ ] `postman/api.postman_collection.json` não foi editado
- [ ] Gerador ausente saiu de `references/gerador.md`; gerador presente permaneceu
- [ ] Nenhum exportador novo de swagger
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
