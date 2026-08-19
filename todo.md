implementar
- filas bullmq
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


skills que precisam ser criadas
- app
- core 
  - 
- infra
  - como usar cache no sistema (nao sobre como usar redis, mas sobre como deve funcionar o cacheamento dos dados)
  - como usar loggers no sistema (o que deve ser logado e o que pode ser ignorado)
  - como usar smtps (criar um modulo em app que possui metodos especializados para cada envio de email - esqueci a senha, boas vindas, etc). (deve ensinar a skill a criar e usar templates na pasta resources)
  - como usar o decorator @swagger (somente depois que criar a skill que criar controllers)
  - criar decorators customizados do class-validator e class-transformer quando for possivel (somente depois que criar skill que cria dtos dos usecases)