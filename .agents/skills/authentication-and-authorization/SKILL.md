---
name: authentication-and-authorization
description: >-
  Autenticação e autorização no nestjs_template. Use ao proteger rotas com
  @RequiredRoles, configurar guards JWT, entender login, ou decorators de auth.
---

# Autenticação e Autorização

## Contexto

Autenticação via JWT (`passport-jwt`). Autorização por **roles** — sem CASL, sem claims.

## Fluxo de Login

1. `POST /auth/login` com email + senha
2. `SignInWithCredentialAndPassword` valida credenciais via `AccountDao`
3. Retorna JWT com payload contendo `roles`

## Proteger Rota

```typescript
@Controller('admin/faq')
@RequiredRoles(AccountRole.ADMIN)
export class FaqAdminController { /* ... */ }
```

`@RequiredRoles` aplica:
- `SetRoles(...roles)` — metadata de roles exigidos
- `JwtAuthGuard` — valida token JWT
- `AuthenticationGuard` — valida conta ativa
- `AuthorizationGuard` — verifica se payload contém role exigido
- `ApiBearerAuth()` + respostas 401/403 no Swagger

## Guards

| Guard | Responsabilidade |
|---|---|
| `JwtAuthGuard` | Valida assinatura e expiração do JWT |
| `AuthenticationGuard` | Verifica se conta existe e está ativa |
| `AuthorizationGuard` | Compara `request.user.roles` com roles exigidos |

## Decorators

| Decorator | Uso |
|---|---|
| `@RequiredRoles(...roles)` | Protege rota com roles |
| `@SetRoles(...roles)` | Define metadata (usado internamente) |
| `@User()` | Extrai payload do request |

## AccountRole

```typescript
export enum AccountRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
```

## Module Setup

Controllers protegidos precisam de `AuthenticationGuardsModule` no imports:

```typescript
@Module({
  imports: [FaqPersistenceModule, AuthenticationGuardsModule],
  controllers: [FaqAdminController],
})
export class FaqModule {}
```

## Rotas Públicas

Controllers user sem `@RequiredRoles` são públicos (ex.: `FaqUserController`).

## Anti-Padrões

- ❌ Verificar role manualmente no controller (use `@RequiredRoles`)
- ❌ Esquecer `AuthenticationGuardsModule` no imports
- ❌ Implementar CASL/claims (não existe neste template)
