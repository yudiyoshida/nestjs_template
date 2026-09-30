implementar
- filas bullmq
- autenticacao via jwt token via cookies http only (para evitar salvamento localstorage)
- autorizacao via casl/claims
- auditoria com interceptors
- checar se formato account - role - admin é o mais correto para projeto de multi-roles
- infra de observabilidade (sentry, etc)

flow
- prd
- techspec
- tasks (usando skills que vao deixar o desenvolvimento bem amarrado)
- loop
  - goal
  - action
  - check
  - decision


skills que precisam ser criadas (em ordem de criacao)
- arquitetura (nesta ordem)
  - creating-prisma-models: model em prisma/schema + seed
  - creating-domain-entities: ddd (entity + factory + enums)
  - creating-dtos: input/output do usecase, dto entre camadas e dto de resposta por controller (retorno diferente por nivel de acesso)
  - creating-custom-validators: decorators do class-validator e class-transformer (depois de creating-dtos)
  - creating-persistence-adapters: dao only vs ddd (dao + repository prisma + persistence module)
  - creating-use-cases
  - creating-controllers: um controller por nivel de acesso
  - using-swagger-decorator: depois de creating-controllers
- creating-feature-modules: orquestrador de nova feature (depois de todas acima)
- ja podem ser criadas
  - using-auth-guards: parte de autenticacao (autorizacao depois de casl/claims)
  - using-cache: como o cacheamento dos dados deve funcionar (nao sobre como usar redis)
  - handling-file-uploads: rota multipart usando a porta upload-file
  - writing-e2e-tests: http ponta a ponta com supertest
- flow
  - writing-prd
  - writing-techspec
  - writing-tasks
  - executing-tasks: loop goal/action/check/decision
  - reviewing-code: check do loop contra as checklists das skills
- dependem de implementacao (ver "implementar")
  - using-auth-guards (autorizacao): depois de casl/claims
  - using-jwt-cookies: depois de cookies http only
  - sending-transactional-emails: depois de refatorar a porta smtp (modulo em app com um metodo por email - esqueci a senha, boas vindas, etc - e templates em resources)
  - using-queues: depois de bullmq
  - creating-scheduled-jobs: depois de escolher @nestjs/schedule ou job repetivel do bullmq (ExpireTips esta sem gatilho)
  - auditing-with-interceptors: depois da auditoria
  - using-error-tracking: depois do sentry
  - creating-account-roles: depois de decidir o formato account - role - admin
  - creating-websocket-drivers: depois de filtro de excecao ws + AuthorizationGuard com suporte a ws
- opcionais: adding-health-checks, using-transactions, emitting-domain-events, using-rate-limiting, writing-frontend-docs
- core: sem skills (coberto por using-core-config e creating-custom-errors)

ajustes nas skills existentes
- writing-unit-tests: secao para spec de dto (ValidationPipe) e de entity/factory
- using-logger: LogContext novo ganha watcher no docker-compose.dev.yml (hoje falta cnpj-lookup)