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


skills que precisam ser criadas
- app
  - authentication
    - skill para guards
      - como funciona autenticacao
      - como funciona autorizacao (com claims - implementar primeiro)
    - skill para jwt token + cookies http only
  - arquitetura
    - application
      - dtos (usado entre camadas - quero criar um dto diferente para retornar aos drivers (ex: criar um dto para cada controller, dessa forma consigo ter diferentes retornos dependendo do nivel de acesso))
      - usecases
    - domain
      - ddd
      - dao only
    - infra
      - driven
        - persistence
      - driver
        - controllers
- core
  - sem skills
- infra
  - como usar cache no sistema (nao sobre como usar redis, mas sobre como deve funcionar o cacheamento dos dados)
  - como usar loggers no sistema (o que deve ser logado e o que pode ser ignorado)
  - como usar smtps (criar um modulo em app que possui metodos especializados para cada envio de email - esqueci a senha, boas vindas, etc). (deve ensinar a skill a criar e usar templates na pasta resources)
  - como usar o decorator @swagger (somente depois que criar a skill que criar controllers)
  - criar decorators customizados do class-validator e class-transformer quando for possivel (somente depois que criar skill que cria dtos dos usecases)