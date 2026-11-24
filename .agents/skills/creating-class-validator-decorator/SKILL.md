---
name: creating-class-validator-decorator
description: Cria o decorator compartilhado de Transform (class-transformer) quando dois DTOs ou mais repetem a mesma transformação de campo, e recria Trim, StringToNumber, StringToBoolean ou StringToDate quando o export não existe. Use quando o usuário pedir para criar decorator compartilhado, decorator de Transform, Trim, StringToNumber, StringToBoolean, StringToDate, ou extrair uma transformação repetida entre DTOs.
---

# Creating Class Validator Decorator

Produz um decorator compartilhado de `Transform` quando dois DTOs ou mais precisam da mesma transformação de campo.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão do decorator de Transform.** Todo o padrão — pasta, assinatura, valor que não é string, `opts`, templates de `Trim`, `StringToNumber`, `StringToBoolean`, `StringToDate` e decorator novo — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia decorators existentes para copiar formato
- leia `*.spec.ts`
- leia DTOs
- abra skill vizinha (`creating-application-dtos`, `writing-unit-tests`, `creating-custom-errors`, `creating-value-objects` ou outra) para copiar seções ou formato
- rode grep ou glob para inferir convenção

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o arquivo que exporta `Trim`, `StringToNumber`, `StringToBoolean` ou `StringToDate`, só para reusar o símbolo quando o export existe (seção "Bloco base")
- o que o usuário indicou como entrada

Exceção: o usuário apontar um arquivo, ou pedir edição de um arquivo que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que dois DTOs ou mais precisam do mesmo Transform. Um único DTO vai para a skill creating-application-dtos
- [ ] 2. Localizar Trim, StringToNumber, StringToBoolean ou StringToDate pelo export quando o pedido for um desses símbolos (ausente → seção "Bloco base")
- [ ] 3. Escrever o decorator novo pelo template, em pasta kebab, quando a transformação ainda não existe e dois DTOs ou mais a compartilham
- [ ] 4. Delegar o spec à skill writing-unit-tests: string transformada, valor que não é string passa intacto, group respeitado quando houver opts
- [ ] 5. Checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Dois DTOs ou mais repetem a mesma transformação de campo | Criar o decorator compartilhado na pasta kebab |
| Usuário pede `Trim` | Reusar o export; se a busca não achar, recriar pelo Bloco base |
| Usuário pede `StringToNumber` | Reusar o export; se a busca não achar, recriar pelo Bloco base |
| Usuário pede `StringToBoolean` ou `StringToDate`, ou um DTO precisa de booleano na query ou de data | Reusar o export; se a busca não achar, criar pelo Bloco base, sem esperar o segundo DTO |
| Usuário pede para extrair um `Transform` repetido | Criar a função PascalCase nova pelo template |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Um único DTO precisa de `@IsString`, `@IsOptional`, `@Trim` já existente, ou de um `Transform` que só esse DTO usa | Skill `creating-application-dtos` |
| Erro de domínio | Skill `creating-custom-errors` |
| Value object | Skill `creating-value-objects` |
| Constraint de `class-validator` (`ValidatorConstraint`, `registerDecorator`) | Fora (sem skill). Esta skill só cria `Transform` de `class-transformer` |

## Bloco base

A skill depende de `Trim`, `StringToNumber`, `StringToBoolean` e `StringToDate`. Localizar pela busca do export antes de escrever. Export encontrado: reusar o símbolo. Export ausente: criar o arquivo inteiro pelo template desta seção, no destino indicado.

Decorator compartilhado só nasce quando dois DTOs ou mais precisam do mesmo `Transform`. Os quatro desta seção são kernel e a exceção: export ausente, o template abaixo cria o arquivo no caminho canônico, já no primeiro DTO que precisar.

| Símbolo | Localizar por | Destino se ausente |
|---------|---------------|--------------------|
| `Trim` | `export function Trim` | `src/infra/validators/class/decorators/trim/trim.ts` |
| `StringToNumber` | `export function StringToNumber` | `src/infra/validators/class/decorators/string-number/string-number.ts` |
| `StringToBoolean` | `export function StringToBoolean` | `src/infra/validators/class/decorators/string-boolean/string-boolean.ts` |
| `StringToDate` | `export function StringToDate` | `src/infra/validators/class/decorators/string-date/string-date.ts` |

```bash
grep -rn "export function Trim" src
grep -rn "export function StringToNumber" src
grep -rn "export function StringToBoolean" src
grep -rn "export function StringToDate" src
```

`Trim`. String passa por `value.trim()`. Valor que não é string volta intacto. `opts` é o segundo argumento de `Transform`.

```ts
import { Transform, TransformOptions } from 'class-transformer';

export function Trim(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string') ? value.trim() : value, opts);
}
```

`StringToNumber`. String passa por `Number(value)`. Valor que não é string volta intacto. `opts` é o segundo argumento de `Transform`.

```ts
import { Transform, TransformOptions } from 'class-transformer';

export function StringToNumber(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string') ? Number(value) : value, opts);
}
```

`StringToBoolean`. As strings `'true'` e `'false'` viram booleano. Outro valor volta intacto, para o `@IsBoolean` recusar. `opts` é o segundo argumento de `Transform`.

```ts
import { Transform, TransformOptions } from 'class-transformer';

export function StringToBoolean(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }, opts);
}
```

`StringToDate`. String ISO 8601 estrita (`isISO8601` com `strict: true`) vira `Date`. Outro valor volta intacto, para o `@IsDate` recusar. `opts` é o segundo argumento de `Transform`. Só para data e hora: data sem hora fica `string` `AAAA-MM-DD`, sem decorator de conversão.

```ts
import { Transform, TransformOptions } from 'class-transformer';
import { isISO8601 } from 'class-validator';

export function StringToDate(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string' && isISO8601(value, { strict: true })) ? new Date(value) : value, opts);
}
```

## Templates

Código do decorator novo. A função exportada é PascalCase. A assinatura é `(opts?: TransformOptions): PropertyDecorator`. `Transform` e `TransformOptions` vêm de `class-transformer`. `PropertyDecorator` não tem import.

O arquivo fica em `src/infra/validators/class/decorators/<kebab>/<kebab>.ts`. A pasta e o arquivo são o kebab-case da função: cada palavra de PascalCase vira um segmento minúsculo separado por hífen. Exemplo: função `NomeDoDecorator`, arquivo `src/infra/validators/class/decorators/nome-do-decorator/nome-do-decorator.ts`. Um arquivo exporta uma função. `Trim`, `StringToNumber`, `StringToBoolean` e `StringToDate` mantêm os caminhos do Bloco base.

O comentário `/* transformação pedida */` e o `value` logo à direita dele são o lugar da expressão que o pedido descreveu. Essa expressão recebe a string e devolve o valor transformado. O ramo que não é string devolve `value`. `opts` segue como segundo argumento de `Transform`, inclusive `groups`.

```ts
import { Transform, TransformOptions } from 'class-transformer';

export function NomeDoDecorator(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string') ? /* transformação pedida */ value : value, opts);
}
```

O DTO que aplica o decorator fica com a skill `creating-application-dtos`. O símbolo que esse DTO usa é a função PascalCase do arquivo criado.

O spec do decorator gerado fica com a skill `writing-unit-tests`. Cenários mínimos, sem colar spec: string transformada, valor que não é string passa intacto, group respeitado quando houver `opts`. `StringToBoolean`: `'true'` e `'false'` convertidos, outra string intacta. `StringToDate`: ISO estrita convertida, data impossível (`2026-02-30`) e string solta intactas.

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| DTO (input, output, query, campo com `@IsString`, `@IsOptional` ou `@Trim`) | Skill `creating-application-dtos` |
| Spec do decorator gerado | Skill `writing-unit-tests` |
| Use case | Skill `creating-use-case` |
| Controller | Skill `creating-controllers` |
| Pipe global novo | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Decorator novo só existe porque dois DTOs ou mais compartilham o mesmo `Transform` (os quatro do Bloco base são a exceção)
- [ ] `Trim`, `StringToNumber`, `StringToBoolean` e `StringToDate` têm o template completo no Bloco base; export existente foi reusado; export ausente foi recriado por esse template
- [ ] Arquivo novo está em `src/infra/validators/class/decorators/<kebab>/<kebab>.ts`, com função exportada em PascalCase
- [ ] Assinatura `(opts?: TransformOptions): PropertyDecorator` e `Transform` importado de `class-transformer`
- [ ] Valor que não é string passa intacto
- [ ] `opts` é o segundo argumento de `Transform`
- [ ] Spec delegada à skill `writing-unit-tests`, com string transformada, não-string intacto e group respeitado quando houver `opts`
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
