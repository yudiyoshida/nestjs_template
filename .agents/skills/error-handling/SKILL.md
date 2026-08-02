---
name: error-handling
description: >-
  Tratamento de erros no nestjs_template. Use ao criar erros tipados, lançar
  exceções de domínio, ou entender o AppException e HttpExceptionFilter.
---

# Tratamento de Erros

## Contexto

Padrão único: `AppException`. Sem Result/Either. Filter global captura e responde `{ message: string }`.

## Criar Erro de Domínio

```typescript
import { AppException } from 'src/core/filters/app.exception';

export class FaqNotFoundError extends AppException {
  constructor() {
    super('FAQ não encontrada', 404);
    this.name = 'FaqNotFoundError';
  }
}
```

Localização: `src/app/<modulo>/domain/errors/<razão>.error.ts`

## Códigos HTTP

| Código | Quando |
|---|---|
| `400` | Default — bad request, validação cruzada |
| `404` | Entidade não encontrada |
| `409` | Conflito (unicidade) |
| `503` | API externa fora do ar |

## Uso no Use Case

```typescript
const faq = await this.dao.findById(id);
if (!faq) {
  throw new FaqNotFoundError();
}
```

## HttpExceptionFilter

- Captura `AppException`
- Sanitiza body (campos sensíveis viram `****`)
- Loga via `ILoggerGateway`
- Responde `{ message: string }` com status code

## Proibido

- ❌ `throw new HttpException(...)`, `BadRequestException`, `NotFoundException`
- ❌ `throw new Error('...')` direto
- ❌ Mensagens em inglês para o usuário final
- ❌ Lançar erro de domínio dentro do DAO (retorne `null`)

## Anti-Padrões

- ❌ Usar exceções do NestJS diretamente
- ❌ Erro genérico sem tipo concreto
- ❌ Mensagem técnica exposta ao usuário
