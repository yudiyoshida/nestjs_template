---
name: sending-transactional-email
description: Acrescenta um e-mail transacional ao SMTP do template — método na porta ISmtpGateway, input tipado, corpo .hbs dentro do layout padrão, envio no adapter Nodemailer e no fake — e o envio no use case, com a regra de falha de e-mail essencial e informativo. Use quando o usuário pedir para enviar e-mail, criar e-mail de boas-vindas, aviso, convite, contato, código ou recuperação de senha, criar template de e-mail .hbs, ou sending-transactional-email.
---

# E-mail transacional

Acrescenta um e-mail novo ao SMTP que já existe e o dispara no use case, com a mesma moldura em todos os e-mails.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de e-mail.** Todo o padrão — método e input na porta, template do corpo, layout e rodapé, renderização, assunto, log, erro, fake, envio no use case e regra de falha — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia o adapter, o fake ou os templates `.hbs` que já existem para copiar formato
- rode grep/glob para inferir convenção
- abra skill vizinha para aprender seção ou template

Se código existente contradiz esta skill, **esta skill vence** no trecho novo.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada
- `smtp.gateway.ts`, `dtos/smtp.dto.ts`, o adapter Nodemailer, o fake e o use case que dispara — só para inserir o trecho
- o `<modulo>.module.ts` do use case — só para inserir o `SmtpModule.register()`
- o arquivo que exporta cada símbolo da seção "Bloco base" — só para reusar

Exceção: usuário apontar um arquivo — leia só esse arquivo.

### Leis

- Um e-mail é um método na porta: `send<Xxx>Email(input: Send<Xxx>EmailInput): Promise<void>`. O input fica em `src/infra/smtp/dtos/smtp.dto.ts`, na linguagem da aplicação (`to`, `name`, `code`). Sem nome de template, assunto ou HTML na porta.
- E-mail para a equipe (contato): o input não tem `to`; o adapter manda para `smtpTo` do `ConfigService`.
- Corpo em `resources/templates/email/<kebab>.hbs`, só o conteúdo, em pt-BR. Variável com `{{ campo }}`, que escapa HTML. Proibido `{{{ campo }}}` com dado que vem do usuário.
- Todo e-mail sai dentro de `layouts/default.hbs`, com o rodapé `partials/footer.hbs`. O adapter renderiza o corpo e o passa como `body` para o layout.
- Renderização só no adapter, com o pacote `handlebars`. Ele precisa estar em `dependencies`, porque o adapter o importa em produção. Sem `nodemailer-express-handlebars`.
- Assunto em pt-BR, vindo do pedido, fixo no método do adapter. Sem nome de projeto fixo; quando o pedido quiser o nome, `[Project name]`, igual ao rodapé.
- Falha do vendor: o adapter loga em `LogContext.SMTP` (`adapter: 'nodemailer'`, `action`, `body: { to }`) e lança `ExternalApiError` com mensagem pt-BR daquele e-mail. Proibido código, token, HTML ou texto da mensagem no log.
- O fake guarda cada envio numa lista pública `sent<Xxx>Emails`. Teste de integração confere o envio por ela.
- O use case injeta `@Inject(TOKENS.SmtpGateway)`, e o módulo dele importa `SmtpModule.register()`. O envio vem depois da gravação.
- **E-mail essencial** (código, link de acesso, redefinição): o `ExternalApiError` escapa e a requisição responde 503.
- **E-mail informativo** (boas-vindas, aviso, contato): o use case segue quando o envio lança `ExternalApiError`; outro erro escapa. O adapter já registrou a falha, então o use case não loga.
- Link no e-mail: a URL base vem de env, pela skill `using-core-config`.
- Envio síncrono, dentro da requisição. Fila está fora.

## Fluxo

```
Progresso:
- [ ] 1. Classificar: essencial ou informativo; para o usuário (to) ou para a equipe (smtpTo)
- [ ] 2. Localizar porta, módulo, ExternalApiError, LogContext.SMTP, layout e rodapé (ausente → seção "Bloco base")
- [ ] 3. Escrever o corpo .hbs
- [ ] 4. Input em smtp.dto.ts e método na porta
- [ ] 5. Método no adapter Nodemailer (render e toVendorMail ausentes → criar pelo template) e no fake
- [ ] 6. Envio no use case pela regra de falha; SmtpModule.register() no módulo dele
- [ ] 7. inventorying-test-scenarios no adapter real, no fake e no use case; depois as skills de spec
- [ ] 8. verifying-delivery e checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| E-mail novo para o usuário (boas-vindas, aviso, convite, código) | Fluxo inteiro, com `to` no input |
| E-mail para a equipe (contato, alerta interno) | Fluxo inteiro, sem `to`; destino `smtpTo` |
| Template `.hbs` novo de e-mail | Passos 3 a 5 |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Vendor novo de SMTP (SES, Resend) | Skill `using-ports-and-adapters` |
| Variável de ambiente nova (URL do front, remetente) | Skill `using-core-config` |
| Anexo, cópia (cc, bcc) ou `replyTo` | Fora (sem skill) |
| Envio em fila ou agendado | Fora (sem skill) |

## Bloco base

Localizar pelo export antes de escrever. Existe: reusar. Ausente: a coluna diz quem cria.

| Símbolo | Localizar por | Destino se ausente |
|---------|---------------|--------------------|
| `ISmtpGateway` | `export interface ISmtpGateway` | Capability `smtp` pela skill `using-ports-and-adapters` |
| `SmtpModule` | `export class SmtpModule` | Capability `smtp` pela skill `using-ports-and-adapters` |
| `ExternalApiError` | `export class ExternalApiError` | Skill `creating-custom-errors` |
| `LogContext.SMTP` | `SMTP = 'smtp'` | Skill `using-logger` |
| Layout | `resources/templates/email/layouts/default.hbs` | Template desta skill |
| Rodapé | `resources/templates/email/partials/footer.hbs` | Template desta skill |

```bash
grep -rn "export interface ISmtpGateway" src
grep -rn "export class SmtpModule" src
grep -rn "export class ExternalApiError" src
grep -rn "SMTP = 'smtp'" src
ls resources/templates/email/layouts/default.hbs resources/templates/email/partials/footer.hbs
```

`resources/templates/email/layouts/default.hbs`

```hbs
<div style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6; color: #222; max-width: 600px">
  {{{ body }}}
  {{> footer }}
</div>
```

`resources/templates/email/partials/footer.hbs`

```hbs
<hr>
<p>Atenciosamente, equipe [Project name].</p>
```

## Templates

`Welcome`, `welcome`, `name` e o assunto são do exemplo. Trocar pelo e-mail do pedido.

### Corpo

`resources/templates/email/welcome.hbs`

```hbs
<p><strong>Olá, {{ name }}!</strong></p>
<p>Sua conta está pronta para uso.</p>
```

### Input e porta

Em `src/infra/smtp/dtos/smtp.dto.ts`:

```ts
export type SendWelcomeEmailInput = {
  to: string;
  name: string;
};
```

E-mail para a equipe, sem `to`:

```ts
export type SendContactMessageEmailInput = {
  name: string;
  email: string;
  message: string;
};
```

Em `ISmtpGateway`, um método por e-mail:

```ts
sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<void>;
```

### Adapter Nodemailer

Os três privados abaixo entram uma vez por adapter. Já existem: reusar.

```ts
private readonly TEMPLATES_DIR = 'resources/templates/email';

private render(name: string, context: Record<string, unknown>): string {
  handlebars.registerPartial('footer', this.readTemplate('partials/footer.hbs'));
  const body = handlebars.compile(this.readTemplate(`${name}.hbs`))(context);

  return handlebars.compile(this.readTemplate('layouts/default.hbs'))({ body });
}

private readTemplate(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), this.TEMPLATES_DIR, file), 'utf-8');
}

private toVendorMail(to: string, subject: string, html: string): NodemailerMailOptions {
  return {
    from: this.config.smtpFrom,
    to,
    subject,
    html,
  };
}
```

O método do e-mail. O `getTransporter()` do adapter já cria o transporte uma vez só.

```ts
public async sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<void> {
  try {
    const html = this.render('welcome', { name: input.name });

    await this.getTransporter().sendMail(this.toVendorMail(input.to, 'Sua conta está pronta', html));
  }
  catch (error) {
    this.logger.error(LogContext.SMTP, {
      adapter: 'nodemailer',
      action: 'sendWelcomeEmail',
      body: { to: input.to },
      error,
    });
    throw new ExternalApiError('Não foi possível enviar o e-mail de boas-vindas');
  }
}
```

E-mail para a equipe: `this.toVendorMail(this.config.smtpTo, '<assunto>', html)` e `body: { to: this.config.smtpTo }` no log.

### Fake

```ts
public readonly sentWelcomeEmails: SendWelcomeEmailInput[] = [];

public async sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<void> {
  this.sentWelcomeEmails.push(input);
}
```

### Use case

No `<modulo>.module.ts`, junto dos imports que já existem:

```ts
imports: [
  SmtpModule.register(),
],
```

No construtor:

```ts
@Inject(TOKENS.SmtpGateway) private readonly smtpGateway: ISmtpGateway,
```

E-mail essencial, depois da gravação. O erro escapa:

```ts
await this.smtpGateway.sendForgotPasswordEmail({ to: email, code });
```

E-mail informativo, depois da gravação. Só `ExternalApiError` é engolido:

```ts
try {
  await this.smtpGateway.sendWelcomeEmail({ to: email, name: data.name });
}
catch (error) {
  if (!(error instanceof ExternalApiError)) {
    throw error;
  }
}
```

### Cenários que o inventário cobre

- Adapter: renderiza o corpo com o contexto e o coloca no layout com o rodapé; envia com `from`, `to`, assunto e HTML; não loga no sucesso; template ilegível lança `ExternalApiError` sem enviar; `sendMail` com falha lança `ExternalApiError` com a mensagem pt-BR e loga sem segredo.
- Fake: guarda o input na lista, em ordem; instâncias não dividem a lista.
- Use case: envia depois de gravar, com o input certo; essencial propaga o erro; informativo segue com `ExternalApiError` e propaga outro erro.

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Vendor novo de SMTP | Skill `using-ports-and-adapters` |
| Env nova | Skill `using-core-config` |
| `ExternalApiError` ausente | Skill `creating-custom-errors` |
| Payload de log | Skill `using-logger` |
| Specs | Skills `inventorying-test-scenarios`, `writing-unit-tests` e `writing-integration-tests` |
| Anexo, cc, bcc, `replyTo`, fila | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Um método e um input na porta, na linguagem da aplicação; sem template, assunto ou HTML na porta
- [ ] Corpo `.hbs` só com o conteúdo, em pt-BR, com `{{ }}` em dado do usuário
- [ ] O e-mail sai dentro do layout, com o rodapé; layout e rodapé criados pelo template quando faltavam
- [ ] Adapter com `render`, `readTemplate` e `toVendorMail` genéricos; assunto sem nome de projeto fixo
- [ ] Falha: log em `LogContext.SMTP` com `body: { to }`, sem segredo; `ExternalApiError` com mensagem pt-BR
- [ ] Fake com a lista `sent<Xxx>Emails`
- [ ] `SmtpModule.register()` no módulo do use case; injeção por `TOKENS.SmtpGateway`
- [ ] Envio depois da gravação; essencial propaga; informativo segue só com `ExternalApiError`
- [ ] `inventorying-test-scenarios` rodou no adapter, no fake e no use case; specs pelas skills de spec
- [ ] `verifying-delivery` rodou
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
