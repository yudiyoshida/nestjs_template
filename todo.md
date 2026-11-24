implementar
- filas bullmq
- autenticacao via jwt token via cookies http only (para evitar salvamento localstorage)
- autorizacao via casl/claims
- auditoria com interceptors
- checar se formato account - role - admin é o mais correto para projeto de multi-roles
- infra de observabilidade (sentry, etc)
  - e-mail informativo que falha (boas-vindas, aviso, contato) é engolido pelo use case e só fica em `logs/smtp.log`
    - no docker-compose.yml de produção, `logs/` não está em volume: o arquivo some a cada deploy (o dozzle só existe no compose de dev)
    - o sentry também não veria, porque o erro não escapa do use case
    - opções: montar `logs/` em volume no compose de produção, ou capturar essa falha no sentry antes de engolir o erro

flow
- prd
- techspec
- tasks (usando skills que vao deixar o desenvolvimento bem amarrado)
- loop
  - goal
  - action
  - check
  - decision

create-new-feature
evolving-existing-module
