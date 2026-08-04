# Auditoria Arquitetural — nestjs_template

Data: 2026-08-03 · Branch: `main` · Commit base: `8ff7743`
Escopo: `src/`, `scripts/`, `resources/`, `prisma/`, `.agents/`
Método: leitura de arquivo com citação obrigatória. `npx tsc -p tsconfig.build.json --noEmit` e `npx eslint` executados.

---

## 1. Resumo executivo

O esqueleto hexagonal está genuinamente correto: nenhum arquivo em `domain/` importa framework, os cinco gateways de `src/infra/` têm interface + adapter real + fake + módulo, e todos os use cases têm spec. Isso é raro e vale registrar.

O maior risco não é arquitetural, é de segurança: **o JWT deste template nunca expira** — `ignoreExpiration: true` nas duas strategies e nenhum `expiresIn` configurado em lugar nenhum. Um token vazado vale para sempre. Em segundo lugar, o módulo DDD de referência (`tip`) **declara uma invariante de negócio que nunca é aplicada**: `TipCannotBeEditedError` existe, tem mensagem escrita, e não é lançada por ninguém — dicas expiradas e removidas são editáveis. Terceiro, **o gerador de código produz módulos que não compilam nem sobem** — placeholders `field` literais nos templates e todos os providers comentados no `module.hbs`.

Como isto é um *template*, os dois primeiros defeitos serão copiados para todo projeto derivado. O gerador é a superfície de maior alavancagem: hoje ele ensina o padrão errado.

---

## 2. Placar

### Por severidade

| Severidade | Qtd |
|---|---|
| Crítico | 4 |
| Alto | 5 |
| Médio | 9 |
| Baixo | 9 |
| **Total** | **27** |

### Por eixo

| Eixo | Achados | Estado |
|---|---|---|
| 3.1 Pureza de camadas | 1 | Quase limpo — `domain/` impecável, ressalva em `shared/` |
| 3.2 Portas e adapters | 2 | Limpo na estrutura; falha no registro |
| 3.3 Modelo de domínio | 5 | Pior eixo junto com 3.6 |
| 3.4 DAO vs Repository | 3 | Divergência doc-endossada |
| 3.5 Casos de uso | 4 | N+1 e ausência de fronteira transacional |
| 3.6 Gerador vs módulos de referência | 5 | Gerador quebrado |
| 3.7 Segurança e correção | 5 | Contém os dois piores achados |
| 3.8 Testes | 2 | Cobertura boa, pirâmide invertida |

---

## 3. Achados

### 🔴 CRÍTICO

---

#### C-1. Fazer o JWT expirar

**Custo: trivial**

`src/app/authentication/infra/strategies/jwt/jwt.strategy.ts:9-13`
```typescript
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: true,
  secretOrKey: process.env.JWT_SECRET,
});
```

`src/app/authentication/infra/strategies/websocket/websocket.strategy.ts:12` — idêntico.

`src/app/authentication/infra/strategies/jwt/jwt.module.ts:12-14` — assinatura sem `signOptions`:
```typescript
useFactory: (configService: ConfigService) => ({
  secret: configService.jwtSecret,
}),
```

Grep por `expiresIn` em `src/` retorna apenas `code.vo.ts`. Não existe `JWT_EXPIRES_IN` em `.env.example`, `.env.development`, `.env.test`, nem getter em `ConfigService`.

**Por que é problema:** os tokens são emitidos sem claim `exp` **e** a verificação ignoraria `exp` se existisse. Um token capturado de um log, de um proxy, do histórico do navegador ou de um dispositivo perdido autentica indefinidamente. Não há logout possível — o projeto não tem denylist. Combinado com C-2 do eixo de autorização (A-4), um usuário desativado continua entrando enquanto o cache de 30s não vira, e o token dele nunca perde validade.

**Correção:**
```typescript
// jwt.module.ts
useFactory: (configService: ConfigService) => ({
  secret: configService.jwtSecret,
  signOptions: { expiresIn: configService.jwtExpiresIn }, // ex.: '15m'
}),
// jwt.strategy.ts e websocket.strategy.ts
ignoreExpiration: false,
```
Adicionar `JWT_EXPIRES_IN` ao `.env.example` e ao schema Joi em `config.module.ts:22`. Se sessões longas forem requisito, isso pede refresh token — mas `ignoreExpiration: true` não é a forma de obter isso.

---

#### C-2. Aplicar a invariante `TipCannotBeEditedError` — hoje ela é decorativa

**Custo: localizado**

`src/app/_examples/tip/domain/errors/tip-cannot-be-edited.error.ts:3-7`
```typescript
export class TipCannotBeEditedError extends AppException {
  constructor() {
    super('Dica não pode ser editada porque está expirada ou removida');
  }
}
```

`grep -rn "TipCannotBeEditedError" --include="*.ts" src` retorna **uma única linha**: a própria declaração.

`src/app/_examples/tip/application/usecases/edit-tip/edit-tip.service.ts:17-31` — o único caminho de edição, sem qualquer checagem de status:
```typescript
const tip = await this.tipDao.findById(id);
if (!tip) { throw new TipNotFoundError(id); }
if (accountId && tip.createdBy !== accountId) { throw new TipNotFoundError(id); }

const tipEntity = TipFactory.load({ ...tip, ...data });
await this.tipRepository.edit(tipEntity);
```

**Por que é problema:** `PUT /user/tips/:id` e `PUT /admin/tips/:id` editam uma dica com status `Expired` ou `Removed` sem reclamar. Uma dica removida pode ser reescrita e continua removida — mas o conteúdo mudou sob os olhos de quem a removeu. Uma dica meteorológica expirada pode ser reeditada e permanece `Expired`, então nunca reaparece: o usuário edita, recebe `200 { message: 'Dica atualizada com sucesso' }`, e nada acontece de visível. O erro existe com a mensagem exata do caso — a regra foi pensada e não foi ligada.

Este é o módulo *de referência DDD*. Ele ensina que invariantes moram na entidade e depois não as aplica.

**Correção:** mover a decisão para a entidade e chamá-la no use case.
```typescript
// tip.entity.ts
public canBeEdited(): boolean {
  return this.isActive();
}
// edit-tip.service.ts — após carregar a entidade, antes de editar
if (!tipEntity.canBeEdited()) {
  throw new TipCannotBeEditedError();
}
```

---

#### C-3. Trocar `Math.random()` por `crypto` em senha e código de verificação

**Custo: trivial**

`src/shared/value-objects/password/password.vo.ts:11-13`
```typescript
public static generateRandom(): string {
  return Math.random().toString(36).slice(-8);
}
```

`src/shared/value-objects/code/code.vo.ts:29-37`
```typescript
private generateCode(): string {
  const characters = '0123456789';
  const charactersLength = characters.length;
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
```

**Por que é problema:** `Math.random()` é um PRNG não-criptográfico (xorshift128+ no V8). Seu estado interno é recuperável a partir de poucas saídas observadas, e a partir daí toda saída futura é previsível. `Password.generateRandom()` é claramente destinado a senha temporária de recuperação; `Code` é um código de 6 dígitos com expiração — o formato canônico de OTP / confirmação de e-mail. Se qualquer um dos dois for ligado a um fluxo de recuperação de conta (e a `IAccountDao` já tem `forgotPassword`/`resetPassword` prontos, ver B-6), um atacante que observe alguns códigos prevê os próximos e toma contas.

`Math.random().toString(36).slice(-8)` é adicionalmente fraco: pode retornar menos de 8 caracteres e o alfabeto efetivo é bem menor que 36^8.

Hoje nenhum dos dois tem consumidor em produção — o risco é latente, não ativo. Mas isto é um template: o próximo desenvolvedor vai chamar `Password.generateRandom()` acreditando que é seguro, porque está em `shared/value-objects/`.

**Correção:**
```typescript
import { randomBytes, randomInt } from 'crypto';

public static generateRandom(): string {
  return randomBytes(12).toString('base64url'); // 16 chars, 96 bits
}

private generateCode(): string {
  return Array.from({ length: 6 }, () => randomInt(0, 10)).join('');
}
```

---

#### C-4. Consertar o gerador — hoje ele produz módulo que não compila nem sobe

**Custo: localizado**

Três defeitos independentes, todos no caminho feliz do `npm run generate:module`.

**(a) Placeholder `field` literal.** `scripts/templates/infra/dao/dao.hbs:25-33`
```handlebars
const where: Prisma.{{moduleNamePascal}}WhereInput = {
  AND: [
    {
      OR: [
        { field: { contains: queries.search, mode: 'insensitive' } },
      ],
    },
  ],
};
```
`field` não é interpolado — sai literal no arquivo gerado. `Prisma.OrderWhereInput` não tem propriedade `field`, então `tsc` falha. Mesmo problema em `scripts/templates/domain/factories/factory.hbs:8` (`props.field`) e `scripts/templates/domain/entities/entity.hbs:9` (`field: string`) — nestes dois é coerente entre si, mas o `repository.hbs:16` grava `field: entity.props.field` numa coluna `field` que o schema Prisma do usuário não terá.

**(b) Módulo gerado não sobe.** `scripts/templates/module/module.hbs:12-18`
```handlebars
providers: [
  // Create{{moduleNamePascal}},
  // Delete{{moduleNamePascal}},
  // Edit{{moduleNamePascal}},
  // FindAll{{moduleNamePascal}},
  // Find{{moduleNamePascal}}ById,
],
```
Todos os providers comentados. Mas `scripts/templates/infra/controller/controller.hbs:9` injeta o use case **não comentado**:
```handlebars
private readonly create{{moduleNamePascal}}Service: Create{{moduleNamePascal}},
```
O Nest falha no bootstrap: `Nest can't resolve dependencies of the OrderController (?)`. O módulo gerado nunca sobe sem edição manual não documentada.

**(c) Rota de escrita sem guard.** `controller.hbs:6-25` gera `@Controller('{{moduleName}}')` com `@Post()` e **nenhum `@RequiredRoles`**. Ambos os módulos de referência protegem todas as rotas de escrita (`faq-admin.controller.ts:19`, `tip-admin.controller.ts:23`, `tip-user.controller.ts:24`). O default do gerador é um endpoint de escrita público.

**Por que é problema:** o gerador é a porta de entrada do template. Hoje o desenvolvedor roda o comando, recebe um módulo quebrado, conserta na mão sem referência, e o hábito de conserto ad-hoc é exatamente o que o `.agents/` tentou eliminar. O item (c) é o mais perigoso: um `@Post()` sem guard passa despercebido em review porque "o gerador criou assim".

**Correção:** trocar `field` por um token interpolado (`{{moduleNameCamel}}Field` ou um prompt de campo no CLI); descomentar os providers no `module.hbs` e comentar o construtor do controller em bloco (ou gerar ambos completos); adicionar `@RequiredRoles(AccountRole.ADMIN)` e o import de `AuthenticationGuardsModule` no `module.hbs`.

---

### 🟠 ALTO

---

#### A-1. `TipFactory.load` é usado como caminho de edição e desvia toda a validação

**Custo: localizado**

`src/app/_examples/tip/application/usecases/edit-tip/edit-tip.service.ts:26-29`
```typescript
const tipEntity = TipFactory.load({
  ...tip,
  ...data,
});
```

`src/app/_examples/tip/domain/factories/tip.factory.ts:49-51` — `load` não valida nada:
```typescript
static load(props: TipProps): Tip {
  return Tip._instantiate(props);
}
```

Compare com `createWeather` (`:18-31`) e `createLocal` (`:33-47`), que chamam `validateCreateProps` e, no caso local, exigem `locationId`.

**Por que é problema:** `load` existe para reidratar dados que **já passaram** pela validação ao serem persistidos. Usá-lo para aplicar um payload de entrada HTTP significa que a edição não tem validação de domínio nenhuma — só a do `class-validator` no DTO. Concretamente: `TipFactory.createLocal` exige `locationId` não-nulo (`:36-38`), mas a edição pode zerar `locationId` de uma dica `Local` e nada reclama. O invariante "dica local sempre tem localização" vale na criação e não vale na edição.

Além disso `...tip` espalha um `TipDto`, que carrega `createdAt`/`updatedAt` (`tip-prisma.dao.ts:39-40`) — campos que não existem em `TipProps`. Compila porque spread não sofre excess property check, e o repositório os ignora silenciosamente.

Tanto `.agents/skills/domain-modeling/SKILL.md:69` quanto `.agents/rules/architecture.mdc` (Rule 2) preveem `Factory.edit(entity, props)`. Ele nunca foi escrito.

**Correção:** implementar `TipFactory.edit(entity: Tip, props: Partial<TipCreateProps>): Tip` que revalida os invariantes e retorna nova instância, e usá-lo em `edit-tip.service.ts`. Isso resolve A-1 e dá o lugar natural para a checagem de C-2.

---

#### A-2. `EditTip` lê pelo DAO e escreve pelo Repository na mesma operação

**Custo: localizado**

`src/app/_examples/tip/application/usecases/edit-tip/edit-tip.service.ts:12-31`
```typescript
constructor(
  @Inject(TOKENS.TipDao) private readonly tipDao: ITipDao,
  @Inject(TOKENS.TipRepository) private readonly tipRepository: ITipRepository,
) {}
...
const tip = await this.tipDao.findById(id);       // read model → TipDto
...
const tipEntity = TipFactory.load({ ...tip, ...data });
await this.tipRepository.edit(tipEntity);          // write model → Tip
```

Compare com `DeleteTip` (`delete-tip.service.ts:16`), que faz certo — lê e escreve pelo Repository.

**Por que é problema:** o `.agents/skills/dao-pattern/SKILL.md:72-76` define os papéis como exclusivos: DAO retorna DTO, Repository retorna entidade. Aqui o DTO de leitura é convertido à força em entidade por um `load` sem validação. A consequência prática é a de A-1 — o objeto que chega ao Repository nunca passou por uma fábrica de verdade. E a conversão só funciona porque `TipDto` e `TipProps` têm hoje os mesmos nomes de campo; no dia em que o read model ganhar um campo derivado ou um join, esse spread quebra de forma silenciosa.

`ExpireTips` tem o mesmo acoplamento (`expire-tips.service.ts:17` DAO / `:26` Repository), mas ali é defensável: ele usa o DAO só para *descobrir ids* e depois recarrega cada entidade pelo Repository. Não é o mesmo defeito.

**Correção:** `EditTip` deve depender apenas de `ITipRepository`. `findById` do Repository já reidrata via Factory (`tip-prisma.repository.ts:60`).

---

#### A-3. Restringir CORS — `enableCors()` sem argumento libera qualquer origem

**Custo: trivial**

`src/main.ts:36`
```typescript
app.enableCors();
```

`src/core/config/config.service.ts:38-40` — o getter existe e **não tem nenhum consumidor** (grep por `corsOrigin` retorna só o getter e seu spec):
```typescript
get corsOrigin(): string {
  return this.nestConfigService.get<string>('CORS_ORIGIN')!;
}
```

`.env.example:8` também já reserva `CORS_ORIGIN=`.

**Por que é problema:** `enableCors()` sem opções responde `Access-Control-Allow-Origin: *`. Qualquer site consegue chamar a API a partir do navegador da vítima. Como a API é Bearer-token (não cookie), isso não é CSRF clássico — mas expõe toda a superfície a qualquer página que consiga um token, e anula a intenção explícita de quem escreveu o `CORS_ORIGIN`. A infraestrutura de configuração foi construída e não foi ligada.

**Correção:**
```typescript
const configService = app.get(ConfigService);
app.enableCors({ origin: configService.corsOrigin });
```
Adicionar `CORS_ORIGIN` ao Joi em `config.module.ts`.

---

#### A-4. `AuthenticationGuard` só barra `INACTIVE`; contas `PENDING` passam

**Custo: trivial**

`src/app/authentication/application/guards/authentication/authentication.guard.ts:32-37`
```typescript
const account = new Account(accountData.status, accountData.roles);
if (account.isInactive) {
  throw new InactiveAccountError();
}
return true;
```

`src/app/authentication/application/usecases/signin-with-credential-and-password/signin-with-credential-and-password.service.ts:31-36` — o login é mais rígido:
```typescript
if (account.isInactive) { throw new InactiveAccountError(); }
if (!account.isActive)  { throw new ForbiddenAccountError(); }
```

`src/app/account/domain/enums/account-status.enum.ts:1-5` — existem três estados:
```typescript
export enum AccountStatus { ACTIVE = 'Ativo', INACTIVE = 'Inativo', PENDING = 'Pendente' }
```

**Por que é problema:** o login rejeita `PENDING` com `ForbiddenAccountError`. O guard não. Então uma conta que estava `ACTIVE` no momento do login e passou a `PENDING` continua acessando todas as rotas protegidas. Somado a C-1 (token não expira) e ao cache de 30s (`authentication.guard.ts:53`), não existe caminho pelo qual essa conta perca acesso — nem esperando, nem deslogando. A duplicação da regra em dois lugares é a causa: uma cópia foi atualizada, a outra não.

**Correção:** extrair a checagem para a própria VO `Account` (ex.: `canAuthenticate()`) e chamar dos dois lados, para que não haja duas cópias divergindo de novo.

---

#### A-5. `Smtp`, `UploadFile` e `CepLookup` nunca são registrados — três gateways inalcançáveis

**Custo: trivial**

`src/infra/infra.module.ts:5-10` — registra apenas dois:
```typescript
@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
  ],
})
```

Grep por `SmtpModule|UploadFileModule|CepLookupModule` fora dos próprios diretórios: **zero ocorrências**. `CacheModule.register()` aparece só em `guards.module.ts:11`.

Os três estão completos e corretos — interface, adapter real, fake, `register()` com chave por `NODE_ENV` (`smtp.module.ts:10-28`, `upload-file.module.ts:10-28`, `cep-lookup.module.ts:11-30`). Simplesmente nada os importa.

**Por que é problema:** o commit `7d2f2de` ("feat: implement SMTP module for password recovery emails") entregou um módulo que não está no grafo de DI. Injetar `TOKENS.SmtpGateway` hoje falha no bootstrap com `Nest can't resolve dependencies`. O desenvolvedor vai descobrir isso em runtime, e a mensagem do Nest não aponta para "falta importar o módulo em `infra.module.ts`".

**Correção:** importar em `InfraModule` (`SmtpModule.register()`, `UploadFileModule.register()`, `CepLookupModule.register()`), ou — se a intenção é registrar sob demanda por feature — documentar isso no `.agents/skills/gateway-adapters/SKILL.md`, que hoje não menciona o passo de registro.

---

### 🟡 MÉDIO

---

#### M-1. Ports de persistência tipados com DTOs de entrada HTTP

**Custo: refatoração ampla**

`src/app/_examples/faq/application/persistence/dao/faq-dao.interface.ts:1-12`
```typescript
import { CreateFaqInputDto } from '../../usecases/create-faq/dtos/create-faq.dto';
import { EditFaqInputDto } from '../../usecases/edit-faq/dtos/edit-faq.dto';

export interface IFaqDao {
  ...
  save(data: CreateFaqInputDto): Promise<string>;
  edit(id: string, data: EditFaqInputDto): Promise<void>;
}
```

`CreateFaqInputDto` é uma classe decorada com `@ApiProperty` e `class-validator` (Rule 8 exige isso). Logo o port de persistência depende do contrato do controller e do Swagger.

**Por que é problema:** mudar a validação ou a documentação OpenAPI de uma rota altera a assinatura do adapter de banco. E `CreateFaq` (`create-faq.service.ts:13`) repassa o DTO direto ao `save`, o que faz o use case ser inutilizável fora do HTTP — chamá-lo de um seed, de um job ou de outro módulo exige construir um DTO de Swagger.

**Isto está endossado pela doc**, não é um desvio: `.agents/skills/dao-pattern/SKILL.md:20-21` mostra exatamente essa assinatura. Então o achado é contra a *intenção hexagonal declarada* em `architecture.mdc` Rule 1, não contra a skill. Registro como **concessão consciente para CRUD simples** — o custo de introduzir um DTO de persistência separado por módulo é real e o benefício em CRUD puro é baixo. A recomendação é limitá-la explicitamente: em módulos DDD o port já trabalha com entidade (`ITipRepository`) e não deve regredir para isto.

---

#### M-2. N+1 e query sem limite em `ExpireTips`

**Custo: localizado**

`src/app/_examples/tip/application/usecases/expire-tips/expire-tips.service.ts:17-28`
```typescript
const [weatherTips] = await this.tipDao.findAll({
  type: TipType.WEATHER,
  status: TipStatus.ACTIVE,
});

for (const tipDto of weatherTips) {
  const tip = await this.tipRepository.findById(tipDto.id);
  if (tip && tip.hasExpired() && tip.isActive()) {
    tip.expire();
    await this.tipRepository.edit(tip);
  }
}
```

`src/infra/database/prisma/prisma.service.ts:14-19`
```typescript
public paginationFactory(page?: number, size?: number) {
  return {
    skip: (page && size) ? ((page - 1) * size) : undefined,
    take: (page && size) ? size : undefined,
  };
}
```

**Por que é problema:** `findAll` é chamado sem `page`/`size`, então `take` é `undefined` e o Prisma traz **a tabela inteira** de dicas meteorológicas ativas. Em seguida, para cada linha, um `findById` (1 query) e possivelmente um `update` (1 query). Com 10.000 dicas ativas isso é 1 + 10.000 + N queries sequenciais, cada uma com round-trip de rede, tudo em memória de uma vez.

O `findById` é redundante além disso: `tipDao.findAll` já retornou `expiresAt` e `status` (`tip-prisma.dao.ts:15,18`) — tudo que `hasExpired()` e `isActive()` precisam. O recarregamento existe só para obter uma instância de entidade.

**Correção:** uma única query. `await this.prisma.tip.updateMany({ where: { type: WEATHER, status: ACTIVE, expiresAt: { lt: new Date() } }, data: { status: EXPIRED } })` exposta como `expireOverdue(): Promise<number>` no `ITipRepository`. Se a passagem pela entidade for inegociável, no mínimo pagine o `findAll` e processe em lotes.

---

#### M-3. Sem paginação padrão, qualquer listagem devolve a tabela inteira

**Custo: localizado**

Mesmo `paginationFactory` de M-2 (`prisma.service.ts:14-19`): sem `page` **e** `size`, `skip`/`take` são `undefined`.

`src/infra/validators/class/dtos/queries/queries.dto.ts:7-19` — ambos são `@IsOptional()`.

`src/app/_examples/faq/infra/drivers/http/user/faq-user.controller.ts:8-23` — rota **pública**, sem `@RequiredRoles`:
```typescript
@Controller('user/faq')
export class FaqUserController {
  @Get()
  public findAll(@Query() queries: FindAllFaqQueryDto): Promise<IPagination<FaqDto>> {
    return this.findAllFaq.execute(queries);
  }
}
```

**Por que é problema:** `GET /user/faq` sem query params retorna todas as FAQs em uma resposta. Não autenticado. O `Pagination` ainda relata `itemsPerPage = total` e `totalPages = 1` (`pagination.vo.ts:24,38-42`), então o cliente não percebe. É um amplificador barato de carga: uma requisição sem parâmetro custa uma varredura de tabela e uma serialização completa.

**Correção:** default no `paginationFactory` (`size ?? 20`, teto de 100) ou `@IsDefined()` em `page`/`size` para rotas públicas. O default no factory é preferível — corrige todas as listagens de uma vez.

---

#### M-4. `TipDaoAdapterPrisma.findAll` usa `Promise.all` em vez de `$transaction` e ignora o padrão `conditions[]`

**Custo: trivial**

`src/app/_examples/tip/infra/driven/persistence/prisma/tip-prisma.dao.ts:47-68`
```typescript
const where: Prisma.TipWhereInput = {
  ...(query.type ? { type: query.type } : {}),
  ...(query.status ? { status: query.status } : {}),
  ...(query.locationId ? { locationId: query.locationId } : {}),
  ...(query.search ? { OR: [...] } : {}),
};

const [tips, total] = await Promise.all([
  this.prisma.tip.findMany({ ... }),
  this.prisma.tip.count({ where }),
]);
```

`architecture.mdc` Rule 4 e `.agents/skills/dao-pattern/SKILL.md:63,66` exigem `$transaction([...])` e `conditions: Prisma.<X>WhereInput[]` + `AND`. O FAQ cumpre (`faq.dao.ts:34`); o Tip não.

**Por que é problema:** `Promise.all` roda as duas queries fora de uma transação. Entre o `findMany` e o `count` outra transação pode inserir ou remover linhas, e a resposta sai inconsistente — `totalItems` que não corresponde à página devolvida, `totalPages` que aponta para uma página vazia. É intermitente e só aparece sob concorrência, que é o pior modo de falha para depurar. Além disso, os dois módulos de referência discordam entre si sobre a mesma regra, então não há resposta certa para copiar.

**Correção:** trocar `Promise.all` por `this.prisma.$transaction([...])` e montar o `where` com o padrão `conditions[]`/`AND` documentado.

---

#### M-5. Regra de negócio no controller

**Custo: trivial**

`src/app/_examples/tip/infra/drivers/http/user/tip-user.controller.ts:63-68`
```typescript
public async findAll(@Query() query: FindAllTipQueryDto): Promise<IPagination<TipDto>> {
  return this.findAllTip.execute({
    ...query,
    status: TipStatus.ACTIVE,
  });
}
```

**Por que é problema:** "usuário final só enxerga dicas ativas" é política de negócio, e ela está no adapter HTTP. `architecture-overview/SKILL.md:75` lista "lógica de negócio em controllers" como anti-padrão explícito. Consequência concreta: se amanhã existir um canal WebSocket ou um job que liste dicas para usuário, a regra não vai junto — ela precisa ser reescrita, e a chance de divergir é alta.

Note também a assimetria: `findById` na mesma classe (`:77-79`) não filtra status, então `GET /user/tips/:id` devolve dicas expiradas e removidas que `GET /user/tips` esconde.

**Correção:** um use case `FindAllActiveTip`, ou um parâmetro de escopo explícito no `FindAllTip.execute(query, scope: 'public' | 'admin')`.

---

#### M-6. Transições de estado da entidade não validam o estado atual

**Custo: trivial**

`src/app/_examples/tip/domain/entities/tip.entity.ts:63-69`
```typescript
public expire(): void {
  this._props.status = TipStatus.EXPIRED;
}

public remove(): void {
  this._props.status = TipStatus.REMOVED;
}
```

**Por que é problema:** `expire()` sobre uma dica `Removed` a devolve para `Expired` — uma dica removida "revive" para um estado não-terminal. Não há guarda de transição nem erro para isso. Hoje `ExpireTips` protege por fora (`expire-tips.service.ts:24` checa `tip.isActive()`), o que só confirma o problema: a regra está no use case, não na entidade, e o próximo chamador de `expire()` não terá como saber que precisa repetir a checagem. `remove()` não tem chamador nenhum, então nasce sem proteção alguma.

**Correção:**
```typescript
public expire(): void {
  if (!this.isActive()) { throw new TipCannotBeExpiredError(); }
  this._props.status = TipStatus.EXPIRED;
}
```

---

#### M-7. Factory lança `AppException` cru e com mensagem em inglês

**Custo: trivial**

`src/app/_examples/tip/domain/factories/tip.factory.ts:9-16,36-38`
```typescript
if (typeof props.title !== 'string' || !props.title || !props.title.trim()) {
  throw new AppException('O campo title não pode ser vazio');
}
...
if (!props.locationId) {
  throw new AppException('Location ID is required for local tips.');
}
```

`architecture.mdc` Rule 7 proíbe as duas coisas: exige tipo concreto estendendo `AppException` ("❌ `throw new Error('...')` direto — sempre tipo concreto") e proíbe "mensagens em inglês para o usuário final".

**Por que é problema:** `AppException` cru não é capturável por tipo — `catch (e) { if (e instanceof TipInvalidTitleError) }` é impossível, sobra comparar strings de mensagem. E `'Location ID is required for local tips.'` chega ao usuário final em inglês, com status 400, via `HttpExceptionFilter` (`http-exception.filter.ts:36`). Mistura de idioma na mesma API que responde `'Dica não pode ser editada...'`.

**Correção:** criar `TipInvalidTitleError`, `TipInvalidContentError`, `TipLocationRequiredError` em `domain/errors/` com mensagens pt-BR.

---

#### M-8. `Account` está em `value-objects/` mas não é um value object

**Custo: trivial**

`src/app/account/domain/value-objects/account.vo.ts:5-27`
```typescript
export class Account {
  private _status: AccountStatus;   // sem readonly
  private _roles: AccountRole[];    // sem readonly

  constructor(status: string, roles: string[]) {
    this.status = status;
    this.roles = roles;
  }
  private set status(status: string) { ... }
  private set roles(roles: string[]) { ... }
```

Sem `equals()`, sem imutabilidade nos campos, sem getter que exponha o valor — só predicados (`isActive`, `isInactive`, `isAdmin`). Compare com os VOs de verdade em `src/shared/value-objects/`, que têm `private readonly _value` e getter (`cnpj.vo.ts`, `email.vo.ts`, etc.).

O arquivo de erros correspondente está em `src/app/account/domain/value-objects/account.error.ts` — `architecture.mdc` Rule 7 e a tabela "Onde Fica o Quê" do `context.md` mandam erros de domínio em `domain/errors/`.

**Por que é problema:** `Account` é na prática um *objeto de política* — valida status/roles e responde perguntas sobre eles. Chamá-lo de VO e colocá-lo em `value-objects/` ensina a categoria errada; o próximo desenvolvedor vai colocar um agregado ali. Os setters privados dão a aparência de imutabilidade sem entregá-la (`_roles` é um array exposto por referência ao construtor — quem passou o array pode mutá-lo depois).

**Correção:** mover para `domain/policies/account.policy.ts` (ou `domain/entities/` se ganhar identidade), mover `account.error.ts` para `domain/errors/`, e marcar os campos `readonly` com cópia defensiva do array.

---

#### M-9. Nenhuma fronteira transacional no projeto

**Custo: refatoração ampla**

Grep por `$transaction` em `src/` (fora de spec) retorna **uma ocorrência**: `faq.dao.ts:34`, e ali é o par `findMany`+`count` de leitura, não uma fronteira de escrita.

Não existe Unit of Work, nem `ITipRepository` recebendo um `tx`, nem `prisma.$transaction(async (tx) => ...)` em nenhum use case — apesar de `architecture.mdc` Rule 4 mandar "operações multi-tabela em `prisma.$transaction(async(tx) => …)`" e Rule 6 prever "saga compensatória manual (try/catch + rollback explícito)".

**Por que é problema:** hoje nenhum use case escreve em duas tabelas, então não há bug ativo — registro isto como **risco estrutural, não defeito**. Mas o primeiro caso real vai aparecer em `account` (criar `Account` + `Role` + `Admin` são três tabelas, ver `prisma/schema/account.prisma:1-31`), e não há padrão a copiar. `ExpireTips` (M-2) já é um caso onde N updates deveriam ser atômicos e não são: se o processo morre no meio, metade das dicas fica expirada e a outra metade não, sem registro de onde parou.

**Correção:** definir o padrão antes de precisar dele — método `transaction<T>(fn: (tx) => Promise<T>)` no `PrismaService` e uma seção em `.agents/skills/repository-pattern/SKILL.md` mostrando o Repository aceitando `tx` opcional.

---

### 🔵 BAIXO

---

#### B-1. `npm run lint` mascara falhas porque roda com `--fix`

**Custo: trivial**

`package.json:14`
```json
"lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
```

`npx eslint "src/**/*.ts"` sem `--fix` reporta **7 erros** (`quotes`), todos do mesmo tipo:
```
src/shared/value-objects/cnpj/cnpj.error.ts:1:30  error  Strings must use singlequote
src/shared/value-objects/code/code.error.ts:1:30  error  Strings must use singlequote
src/shared/value-objects/cpf/cpf.error.ts:1:30  error  Strings must use singlequote
src/shared/value-objects/document/document.error.ts:1:30  error
src/shared/value-objects/email/email.error.ts:1:30  error
src/shared/value-objects/phone/phone.error.ts:1:30  error
src/shared/value-objects/utc-date/utc-date.error.ts:1:30  error
```

`architecture.mdc` Rule 10 exige "`npm run lint` passa" — ele sempre passa, porque conserta antes de reportar. Em CI isso significa que o job ou modifica o working tree, ou passa sem verificar nada. **`tsc --noEmit` passa limpo** — o build está saudável.

**Correção:** `"lint": "eslint ..."` e `"lint:fix": "eslint ... --fix"`. CI usa o primeiro.

---

#### B-2. Os dois módulos de referência discordam sobre onde mora o DAO

**Custo: trivial**

| | FAQ | Tip | `context.md` (tabela "Onde Fica o Quê") |
|---|---|---|---|
| Caminho | `infra/driven/persistence/faq.dao.ts` | `infra/driven/persistence/prisma/tip-prisma.dao.ts` | `infra/driven/persistence/prisma/<modulo>-prisma.dao.ts` |
| Classe | `FaqDaoAdapterPrisma` | `TipDaoAdapterPrisma` | `<Entity>DaoAdapterPrisma` |

`src/app/account/infra/driven/persistence/prisma/account-prisma.dao.ts:23` acrescenta uma terceira variação no nome da classe:
```typescript
export class AccountPrismaAdapterDao implements IAccountDao {
```
`Rule 4` manda `<Entity>DaoAdapterPrisma` — seria `AccountDaoAdapterPrisma`.

`scripts/generators/infra.generator.ts:33-38` gera no caminho do Tip (correto). O FAQ é o outlier.

**Correção:** mover `faq.dao.ts` para `infra/driven/persistence/prisma/faq-prisma.dao.ts`; renomear `AccountPrismaAdapterDao` → `AccountDaoAdapterPrisma`.

---

#### B-3. `ITipRepository.findById` tem vírgula sobrando

**Custo: trivial**

`src/app/_examples/tip/application/persistence/repository/tip-repository.interface.ts:7`
```typescript
findById(id: string, ): Promise<Tip | null>;
```
Resquício de um segundo parâmetro removido. Não quebra nada; o ESLint atual não pega.

---

#### B-4. `save()` do Repository: doc diz que retorna `id`, código e template retornam `void`

**Custo: trivial**

`.agents/skills/repository-pattern/SKILL.md:18,59` e `architecture.mdc` Rule 4 (linha 151): *"`save(entity)` retorna o `id`; `edit(entity)` retorna `void`"*.

Código (`tip-repository.interface.ts:4`): `save(tip: Tip): Promise<void>;`
Template (`scripts/templates/application/persistence/repository-interface.hbs:4`): `save(entity: X): Promise<void>;`

Código e gerador concordam entre si; a doc é a divergente. Faz sentido: o id vem da Factory (`tip.factory.ts:26` — `new UUID().value`), então o use case já o tem antes do save (`create-local-tip.service.ts:24`). Retornar id seria redundante.

**Correção:** corrigir a doc, não o código.

---

#### B-5. Valores de enum divergem entre doc e código, e trocam de idioma entre módulos

**Custo: trivial**

`.agents/skills/domain-modeling/SKILL.md:83-87` documenta:
```typescript
export enum TipStatus { ACTIVE = 'ACTIVE', EXPIRED = 'EXPIRED', REMOVED = 'REMOVED' }
```
`src/app/_examples/tip/domain/enums/tip-status.enum.ts:1-5` implementa:
```typescript
export enum TipStatus { ACTIVE = 'Active', EXPIRED = 'Expired', REMOVED = 'Removed' }
```

E `src/app/account/domain/enums/account-status.enum.ts:1-5` usa português:
```typescript
export enum AccountStatus { ACTIVE = 'Ativo', INACTIVE = 'Inativo', PENDING = 'Pendente' }
```
enquanto `account-role.enum.ts:1-4` usa inglês (`ADMIN = 'ADMIN'`).

**Por que importa:** esses valores são gravados como `String` no banco (decisão registrada no `context.md`). Três convenções diferentes de casing/idioma em colunas de status significa que qualquer query manual, dashboard ou relatório precisa saber qual convenção aquele módulo usou. `architecture.mdc` Rule 8 pede identificadores em inglês.

---

#### B-6. Recuperação de senha meio construída

**Custo: localizado**

Port declarado — `src/app/account/application/persistence/dao/account-dao.interface.ts:7-8`:
```typescript
forgotPassword(id: string, passwordResetToken: string): Promise<void>;
resetPassword(id: string, password: string): Promise<void>;
```
Adapter implementado — `account-prisma.dao.ts:75-90`. Coluna existe — `prisma/schema/account.prisma:5`. E-mail pronto — `resources/templates/email/forgot-password.hbs`, `SmtpModule` completo.

Mas o controller está comentado (`authentication.controller.ts:10-11,27-37`), o spec também (`authentication.controller.spec.ts:36-57`), **não existe nenhum use case** `ForgotPassword`/`ResetPassword` em `src/app/authentication/application/usecases/`, e o `SmtpModule` não está registrado (A-5).

Dois problemas adicionais quando isso for ligado:
- Os nomes `forgotPassword`/`resetPassword` são nomes de *caso de uso* dentro de um port de persistência. O DAO deveria expor `updatePasswordResetToken` / `updatePassword` — o que ele faz — e não o fluxo de negócio.
- É exatamente aqui que `Password.generateRandom()` e `Code` (C-3) serão usados. Corrigir C-3 **antes** de ligar isto.

---

#### B-7. Estratégia e guard de WebSocket nunca registrados

**Custo: trivial**

`src/app/authentication/infra/strategies/websocket/websocket.strategy.ts` e `websocket.guard.ts` existem. `JwtAuthModule` (`jwt.module.ts:17-19`) registra apenas `JwtStrategy`. `JwtWebSocketStrategy` não aparece em `providers` de nenhum módulo.

`JwtWebSocketAuthGuard` (`websocket.guard.ts:5`) estende `AuthGuard('jwt-ws')` — usá-lo hoje falha em runtime com `Unknown authentication strategy "jwt-ws"`, porque a strategy nunca foi registrada no Passport. Falha silenciosa até alguém tentar.

---

#### B-8. Seed cria admin com senha `123456`

**Custo: trivial**

`prisma/seeds/admin.ts:18-20`
```typescript
email: 'admin@email.com',
password: new Password('123456').value,
status: AccountStatus.ACTIVE,
```

`package.json:20` — `db:seed` roda com `dotenv -e .env.development`, então está amarrado ao ambiente de desenvolvimento. É uma concessão razoável para DX local. O risco é o template ser copiado e o seed rodar contra um banco compartilhado ou de staging: fica um admin com credencial trivial e previsível. Vale ler a senha de env com fallback só em `NODE_ENV=development`.

---

#### B-9. Divergências menores entre doc e código

**Custo: trivial**

- `.agents/skills/dependency-injection/SKILL.md:17-24` lista 6 tokens; `src/core/di/token.ts:1-13` tem 9 (faltam `CepLookupGateway`, `SmtpGateway`, `UploadFileGateway`).
- `context.md` ("Estrutura de Diretórios") lista `src/infra/` como cache, database, logger, openapi, validators — omite `cep-lookup/`, `smtp/`, `upload-file/`, que existem.
- `README.md:1-23,122-134` ainda é o boilerplate do NestJS (badges do repositório do Nest, "Author - Kamil Myśliwiec"). A seção útil, "Code Generation" (`:61-119`), está enterrada no meio.
- `README.md:112` manda rodar `npm run db:migration` após adicionar o model — correto e coerente com `package.json:18`. Os três passos pós-geração continuam válidos.
- `scripts/cli.ts:41-42` imprime as duas linhas de token (`Dao` **e** `Repository`) mesmo em modo `simple`, onde não há repositório.
- `README.md:75` diz que o nome do módulo "must be in kebab-case", mas `cli.ts` não valida — `generate:module MeuModulo` gera caminhos e classes inconsistentes sem aviso.

---

## 4. O que está correto

Não é elogio genérico — são coisas que costumam estar erradas em projetos com esta estrutura e aqui estão certas.

**`domain/` é realmente puro.** O grep de vazamento (`@nestjs|@prisma|axios|bcrypt|redis|src/infra` sob `*/domain/*`, excluindo specs) retorna **zero linhas**. Todos os imports que cruzam para dentro de `domain/` vêm de `application/` e `infra/` — direção correta. Nenhum `domain/` importa de `application/` ou `infra/`. Essa é a regra que mais escapa na prática e ela está mantida em 100% dos arquivos.

**Os cinco gateways estão completos, sem exceção.** `cache`, `logger`, `smtp`, `upload-file`, `cep-lookup` — cada um com interface (`<x>.gateway.ts`), adapter real, adapter fake e módulo. A troca por `NODE_ENV` está correta em todos (`smtp.module.ts:11`, `upload-file.module.ts:11`, `cep-lookup.module.ts:12`, `cache.module.ts`). Rule 9 é cumprida integralmente. O defeito de A-5 é de *registro*, não de estrutura — a estrutura está impecável.

**Todos os tokens em `src/core/di/token.ts`, nenhum `@Inject` com string literal.** Os 9 tokens são `Symbol.for(...)` no arquivo único, e todo `@Inject` verificado usa `TOKENS.X` com `import type` na interface (`edit-tip.service.ts:6-7,13-14`, `create-faq.service.ts:3,9`, `authentication.guard.ts:7,14`). Rule 6 e a skill de DI cumpridas.

**Todo use case tem spec.** A varredura por diretório de use case sem `*.service.spec.ts` correspondente retorna **zero**. São 55 specs, 28 usando `Test.createTestingModule` com banco real, 10 unitários com `createMock`, e 20 arquivos com asserção de erro (`toThrow`/`rejects.toThrow`) — ou seja, caminho de erro é testado, não só o feliz.

**`HttpExceptionFilter` sanitiza recursivamente.** `http-exception.filter.ts:39-59` percorre arrays e objetos aninhados antes de logar, mascarando `password`. Muita implementação disso só olha o nível raiz.

**A escolha de `AccountDto` vs `AccountWithSensitiveDataDto` é deliberada e correta.** `account-prisma.dao.ts:9-20` define dois `select` distintos, e `findById` — usado pelo `AuthenticationGuard`, cujo resultado vai para o cache Redis (`authentication.guard.ts:53`) — usa o `AccountSelect` **sem** `password` nem `passwordResetToken`. O DTO com dados sensíveis só é devolvido por `findByCredential`/`findByEmail`, consumidos exclusivamente pelo login (`signin...service.ts:20,25`), e nenhum dos dois chega a uma resposta HTTP. Não há vazamento de hash de senha em DTO de resposta, log ou cache.

**`ownership check` nas rotas de usuário.** `edit-tip.service.ts:22-24` e `delete-tip.service.ts:20-22` verificam `createdBy` contra o `accountId` e lançam **`TipNotFoundError`** — não um erro de autorização. Isso evita enumeração: o usuário não descobre que o recurso existe mas é de outro. Detalhe bem feito.

**`Tip.props` devolve cópia.** `tip.entity.ts:30-32` — `return { ...this._props }`. Construtor privado, `_instantiate` estático, reidratação sempre via `TipFactory.load` no adapter (`tip-prisma.repository.ts:60`). Rule 2 cumprida na estrutura da entidade (o que falta é comportamento — C-2, M-6).

**`tsc --noEmit` passa limpo** no `tsconfig.build.json`.

---

## 5. Código morto

Exports sem nenhum consumidor fora do próprio diretório e dos specs.

| Artefato | Arquivo | Consumidores |
|---|---|---|
| `TipCannotBeEditedError` | `src/app/_examples/tip/domain/errors/tip-cannot-be-edited.error.ts:3` | **0** — ver C-2 |
| `Tip.remove()` | `src/app/_examples/tip/domain/entities/tip.entity.ts:67` | 0 |
| `Password.generateRandom()` | `src/shared/value-objects/password/password.vo.ts:11` | 0 — ver C-3 |
| `Code` (VO inteiro) | `src/shared/value-objects/code/code.vo.ts` | 0 — ver C-3 |
| `CNPJ` | `src/shared/value-objects/cnpj/cnpj.vo.ts` | 0 |
| `CPF` | `src/shared/value-objects/cpf/cpf.vo.ts` | 0 |
| `Document` | `src/shared/value-objects/document/document.vo.ts` | 0 |
| `Email` | `src/shared/value-objects/email/email.vo.ts` | 0 |
| `Phone` | `src/shared/value-objects/phone/phone.vo.ts` | 0 |
| `ZipCode` | `src/shared/value-objects/zip-code/zip-code.vo.ts` | 0 |
| `DocumentAlreadyTakenError` | `src/shared/errors/document-already-taken.ts` | 0 |
| `EmailAlreadyTakenError` | `src/shared/errors/email-already-taken.ts` | 0 |
| `IAccountDao.forgotPassword` / `.resetPassword` | `account-dao.interface.ts:7-8` | 0 — ver B-6 |
| `JwtWebSocketStrategy` / `JwtWebSocketAuthGuard` | `infra/strategies/websocket/` | 0 — ver B-7 |
| `TOKENS.SmtpGateway` / `.UploadFileGateway` / `.CepLookupGateway` | `src/core/di/token.ts:3,5,6` | 0 fora de `src/infra/` — ver A-5 |
| `ConfigService.corsOrigin` | `src/core/config/config.service.ts:38` | 0 — ver A-3 |
| `FaqModule` / `TipModule` | `faq.module.ts:29`, `tip.module.ts:33` | 0 — não importados em `app.module.ts:6-12` |

**Ressalva importante:** este é um repositório *template*. Os VOs de `shared/` (CNPJ, CPF, Document, Email, Phone, ZipCode), os erros compartilhados e os gateways não usados são **inventário deliberado** — existem para serem consumidos por projetos derivados, e todos têm spec próprio. Não recomendo removê-los. Listo-os para completude do eixo, não como defeito.

Os que **são** defeito: `TipCannotBeEditedError` (invariante não aplicada), `Password.generateRandom` e `Code` (inseguros e prontos para uso — remover ou corrigir antes que alguém chame), `forgotPassword`/`resetPassword` (feature meio construída), e a strategy WebSocket (falha em runtime se usada).

`FaqModule`/`TipModule` fora do `app.module.ts` é correto — são exemplos, não devem expor rotas. Os specs de integração importam os módulos diretamente, então continuam sendo testados.

---

## 6. Divergências entre doc e código

### A doc promete e o código não cumpre

| Doc | Promessa | Realidade |
|---|---|---|
| `domain-modeling/SKILL.md:69`, `architecture.mdc` Rule 2 | `TipFactory.edit(entity, props)` valida e retorna nova instância | Não existe. `edit-tip.service.ts:26` usa `load` sem validação (**A-1**) |
| `architecture.mdc` Rule 4 (l.144), `dao-pattern/SKILL.md:63` | `findAll`: `findMany` + `count` em `$transaction([...])` | `tip-prisma.dao.ts:59` usa `Promise.all` (**M-4**) |
| `architecture.mdc` Rule 4 (l.142), `dao-pattern/SKILL.md:66` | Where com `conditions[]` + `AND` | `tip-prisma.dao.ts:47-57` usa spread condicional (**M-4**) |
| `architecture.mdc` Rule 4 (l.149) | Multi-tabela em `$transaction(async(tx) => …)` | Nenhuma fronteira transacional existe (**M-9**) |
| `architecture.mdc` Rule 7 | Sempre tipo concreto estendendo `AppException`; nunca mensagem em inglês | `tip.factory.ts:11,14,37` — `AppException` cru, uma em inglês (**M-7**) |
| `architecture.mdc` Rule 7 (l.225) | "Não lançar erro de domínio no DAO" | Cumprido — DAOs retornam `null`. ✅ |
| `architecture.mdc` Rule 10 | "`npm run lint` passa" | Passa só porque roda `--fix` (**B-1**) |
| `context.md` "Onde Fica o Quê" | DAO em `infra/driven/persistence/prisma/<x>-prisma.dao.ts` | FAQ está em `infra/driven/persistence/faq.dao.ts` (**B-2**) |
| `architecture.mdc` Rule 4 (l.138) | Adapter `<Entity>DaoAdapterPrisma` | `AccountPrismaAdapterDao` (**B-2**) |
| `architecture-overview/SKILL.md:75` | "❌ Lógica de negócio em controllers" | `tip-user.controller.ts:66` força status (**M-5**) |
| `gateway-adapters/SKILL.md` | Padrão gateway completo | Estrutura ✅, mas 3 de 5 nunca registrados; a skill não menciona o passo de registro (**A-5**) |

### O código faz e a doc não registra

| Realidade | Doc |
|---|---|
| `save()` do Repository retorna `void` (código + template concordam) | Doc diz que retorna `id` (**B-4**) — a doc é que está errada |
| `TipStatus = 'Active'`; `AccountStatus` em português | `domain-modeling/SKILL.md:83-87` diz `'ACTIVE'` (**B-5**) |
| 9 tokens em `token.ts` | `dependency-injection/SKILL.md:17-24` lista 6 (**B-9**) |
| `src/infra/` tem `cep-lookup/`, `smtp/`, `upload-file/` | `context.md` não os lista (**B-9**) |
| Ports de DAO recebem DTOs HTTP | `dao-pattern/SKILL.md:20-21` **endossa** — divergente da intenção hexagonal da Rule 1, não da skill (**M-1**) |

### Gerador vs módulos de referência (eixo 3.6)

| Aspecto | Gerador | FAQ | Tip |
|---|---|---|---|
| Caminho do DAO | `infra/driven/persistence/prisma/` ✅ | `infra/driven/persistence/` ❌ | `.../prisma/` ✅ |
| `<X>Select satisfies` | **ausente** (`dao.hbs`) ❌ | presente ✅ | presente ✅ |
| `$transaction` no `findAll` | presente ✅ | presente ✅ | `Promise.all` ❌ |
| Controller admin/user | arquivo único, sem split ❌ | split ✅ | split ✅ |
| `@RequiredRoles` na escrita | **ausente** ❌ | presente ✅ | presente ✅ |
| Providers no módulo | **comentados** ❌ | preenchidos ✅ | preenchidos ✅ |
| Compila? | **não** (`field` literal) ❌ | ✅ | ✅ |

Os passos pós-geração do `README.md:101-118` continuam corretos (token, schema, `app.module.ts`) — o problema não são os passos documentados, é que existem passos **não** documentados sem os quais nada funciona (**C-4**).

---

## 7. Suspeitas não confirmadas

**1. Enumeração de usuário por timing no login.** `signin...service.ts:20-28` — quando a conta não existe, retorna antes de chamar `Password.compare`; quando existe, paga o custo do bcrypt (10 rounds, ~50-100ms). A mensagem de erro é idêntica nos dois casos (`InvalidCredentialError`), o que é correto, mas a diferença de latência é potencialmente mensurável. **Não medi.** Confirmação exigiria cronometrar N requisições com credencial existente vs. inexistente e testar a separação estatística das distribuições — não executei o servidor. Mitigação padrão: comparar contra um hash dummy quando a conta não existe.

**2. `AuthorizationGuard` pode lançar `TypeError` se usado sem `@SetRoles`.** `authorization.guard.ts:17-22`:
```typescript
const requiredRoles = this.reflector.getAllAndOverride<AccountRole[]>(ROLE_KEY, [...]);
if (!requiredRoles.length) { return true; }
```
`getAllAndOverride` devolve `undefined` quando a metadata não existe, e `undefined.length` lança. Hoje o único caminho que instala o guard é `RequiredRoles` (`required-role.decorator.ts:11-13`), que sempre chama `SetRoles` antes — então **na prática não dispara**. Mas o guard é exportado por `AuthenticationGuardsModule:21` e pode ser usado avulso com `@UseGuards(AuthorizationGuard)`. **Não confirmei** que nenhum uso avulso existe hoje (o grep cobriu `src/`, mas não valida uso futuro), nem escrevi o teste que provaria o crash. Correção defensiva de uma linha: `if (!requiredRoles?.length)`.

**3. Comportamento de `select: { roles: true }` no Prisma.** `account-prisma.dao.ts:11` seleciona a relação `roles` inteira, e o mapeamento em `:39` faz `account.roles.map(r => r.role)` — descartando `id` e `accountId` de cada `Role`. Suspeito que traga colunas a mais do banco do que o DTO precisa (eixo 3.7). **Não confirmei** qual SQL o Prisma emite para `select` de relação sem `select` aninhado; exigiria rodar com `log: ['query']`. O impacto é baixo (duas colunas curtas por role), mas o `select` aninhado seria mais preciso.

**4. Cobertura de teste real.** Contei 55 arquivos de spec, 28 de integração, 10 com `createMock`, 20 com asserção de erro. **Não rodei `npm test` nem `--coverage`** — exigiria PostgreSQL de teste no ar (os 28 specs de integração usam banco real por `architecture.mdc` Rule 5). Nenhum número de cobertura percentual é afirmado neste relatório.

**5. Fakes praticamente não exercitados.** Grep por `CacheModule|SmtpModule|UploadFileModule|CepLookupModule|LoggerModule` em `*.spec.ts` retorna **uma única linha**: `http-exception.filter.spec.ts:5,17` (`LoggerModule`). Isso sugere que os fakes de cache, SMTP, upload e CEP nunca são exercitados. **Não confirmei** se os specs de integração os alcançam indiretamente — `guards.module.ts:11` importa `CacheModule.register()`, então `authentication.guard.spec.ts` pode tocar o fake de cache por transitividade. Verificação que falta: instrumentar cada fake e rodar a suíte. Se confirmado, é o retorno principal de ter portas que está sendo desperdiçado — ver eixo 3.8 abaixo.

---

## 8. Plano de ataque

Ordem por risco em produção primeiro, e dentro do mesmo risco, custo crescente.

Legenda de status: ✅ Concluído · 🔄 Em andamento · ⏳ Pendente

### 1º — C-1: expirar o JWT
**Status: ✅ Concluído** — `JWT_EXPIRES_IN` configurado, `ignoreExpiration: false` nas duas strategies, `signOptions.expiresIn` no `JwtModule`. **A-4** (guard aceitando `PENDING`) feito junto, mesma sessão: `Account.canAuthenticate` extraído e usado tanto no guard quanto no login. Como consequência direta de expirar o access token, o fluxo de refresh token também foi implementado (login emite `accessToken`+`refreshToken`, endpoint `POST /auth/refresh` rotaciona, `POST /auth/logout` revoga) — não era um achado do audit, mas fechava a lacuna "sem logout possível" que este item aponta.

Trivial (4 linhas + 1 env var), e é a única falha aqui que já vale contra o sistema como ele está hoje, sem depender de nenhuma feature futura. Token vazado = acesso permanente, sem logout possível. Enquanto isso não estiver corrigido, nenhuma outra medida de autenticação importa. Faça junto o **A-4** (guard aceitando `PENDING`) — mesma área, mesma sessão de trabalho, e os dois juntos são o que fecha o ciclo de vida da sessão.

### 2º — C-3: `Math.random()` → `crypto`
**Status: ✅ Concluído** — `Password.generateRandom` usa `randomBytes(12).toString('base64url')` (16 chars); `Code.generateCode` usa `randomInt(0, 10)`. Spec de senha ajustado para o novo comprimento. `tsc --noEmit` limpo.

Trivial (duas funções), e a janela era **agora**: hoje nenhum dos dois tem consumidor, então a correção foi uma troca isolada com zero risco de regressão. No momento em que a recuperação de senha (**B-6**) for ligada — e a infraestrutura dela já está toda pronta, faltando só o use case — isso viraria uma tomada de contas explorável e a correção passaria a exigir invalidar códigos em trânsito. Corrigido antes de precisar.

### 3º — C-2 + A-1 + M-6: fechar o modelo de domínio do Tip
**Status: ⏳ Pendente** — próximo passo.

Localizado, e são três sintomas do mesmo buraco, então trate como uma unidade: implementar `TipFactory.edit` (A-1) cria o lugar onde a checagem de `TipCannotBeEditedError` (C-2) naturalmente mora, e mover a guarda de transição para `expire()` (M-6) completa o padrão. Fazer separado significa mexer nos mesmos quatro arquivos três vezes. Vem depois dos itens de segurança porque o impacto é corrupção de dados de negócio, não comprometimento de conta — mas vem antes de tudo o mais porque `tip` é o módulo que ensina DDD neste repositório, e hoje ele ensina a versão sem invariantes. **A-2** (mistura DAO/Repository) cai fora quase de graça no mesmo refactor.

### 4º — A-3 + A-5: ligar o que já está construído
**Status: ⏳ Pendente**

Trivial os dois, e agrupo por serem o mesmo tipo de defeito: infraestrutura correta e completa que ninguém plugou. `enableCors()` com a origem configurada é uma linha e fecha a API para o navegador; registrar `Smtp`/`UploadFile`/`CepLookup` no `InfraModule` são três linhas e desbloqueia B-6 e qualquer feature que dependa deles. Alto retorno por linha alterada, e nenhum risco de regressão — hoje esses caminhos simplesmente não executam.

**Fora do top 5, mas barato:** **B-1** (tirar `--fix` do script de lint) é uma linha e é o que impede o CI de mascarar os próximos problemas. Faça junto com qualquer um dos itens acima. **Status: ⏳ Pendente**

### 5º (último) — C-4: consertar o gerador
**Status: ⏳ Pendente**

Movido para o fim de propósito, apesar do maior multiplicador do repositório. Motivo: o gerador deve ensinar o padrão *já corrigido*, não o atual. Os templates (`service.hbs`, `module.hbs`, `controller.hbs`, `factory.hbs`) precisam refletir `TipFactory.edit` (item 3º), a checagem de invariante na entidade, e o guard de autorização coerente com A-3/A-5 — mexer no gerador antes disso significa reescrever os mesmos templates duas vezes. Ao chegar aqui: item (c) primeiro — `@RequiredRoles` no template, menor custo e maior consequência —, depois (b) módulo/controller/`service.hbs` de `create` (achado adicional durante investigação: o body do `create/service.hbs` é um placeholder sem `return`, quebra `tsc` mesmo sem mexer em nada de Prisma), depois (a) o placeholder `field`.

---

### Nota sobre o eixo 3.8 (testes)

A suíte é sólida em cobertura — todo use case tem spec, caminhos de erro são testados em 20 arquivos. O desequilíbrio é de forma: **28 specs de integração contra 10 unitários com mock**. A pirâmide está invertida, e a consequência prática é que a suíte exige PostgreSQL no ar e roda com `--runInBand` (serial, por `package.json:15`).

O ponto que vale registrar: o projeto pagou o custo de definir ports em todo lugar, e o retorno principal disso — testes unitários rápidos contra os fakes, sem banco — **não está sendo colhido** (ver suspeita 5). Os fakes de cache, SMTP, upload e CEP existem, estão corretos, e aparentemente nenhum teste os exercita. É a diferença entre ter arquitetura hexagonal e usar arquitetura hexagonal.
