#!/usr/bin/env bash
# Auditoria de conformidade do template. Rodar na raiz do repositório:
#   bash .agents/skills/auditing-template-conformance/references/checks.sh
# Cada bloco imprime "### <id> <lei>" e, embaixo, as ocorrências ou "ok".
# "verificar" no título: checagem aproximada. O agente abre o arquivo e decide.
# Só lê arquivos: não corrige nada e não imprime segredo.
set -u

section() {
  printf '\n### %s\n' "$1"
}

print_or_ok() {
  local text
  text=$(printf '%s\n' "$1" | grep -v '^[[:space:]]*$')
  if [ -n "$text" ]; then
    printf '%s\n' "$text"
  else
    echo ok
  fi
}

no_spec() {
  grep -vE '\.spec\.ts(:|$)'
}

kebab() {
  printf '%s' "$1" | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' | tr 'A-Z' 'a-z'
}

pascal() {
  printf '%s' "$1" | awk -F- '{ for (i = 1; i <= NF; i++) printf "%s%s", toupper(substr($i, 1, 1)), substr($i, 2) }'
}

MODULES=$(for dir in src/app/*/; do [ -d "$dir" ] && basename "$dir"; done)

# A. Camadas

section "A1 Prisma fora do adapter Prisma"
print_or_ok "$(grep -rlE 'PrismaService|@prisma/client' src --include='*.ts' | no_spec | grep -vE '/infra/driven/persistence/prisma/|^src/infra/database/')"

section "A2 Classe de adapter importada na camada de aplicação, fora do módulo de persistência"
print_or_ok "$(grep -rnE 'AdapterPrisma|AdapterGateway' src/app --include='*.ts' | no_spec | awk -F: '$1 ~ /\/application\// && $1 !~ /\/application\/persistence\//')"

section "A3 process.env fora de main.ts, config.module.ts e XxxModule.register()"
print_or_ok "$(grep -rn 'process\.env' src --include='*.ts' | no_spec | grep -vE '^src/main\.ts:|^src/core/config/config\.module\.ts:|^src/infra/[^/]+/[^/]+\.module\.ts:')"

section "A4 Exceção do Nest no lugar de AppException"
print_or_ok "$(grep -rnE '(HttpException|NotFoundException|BadRequestException|ForbiddenException|UnauthorizedException|ConflictException|UnprocessableEntityException)([^A-Za-z]|$)' src --include='*.ts' | no_spec)"

section "A5 new AppException direto, sem classe de erro"
print_or_ok "$(grep -rn 'new AppException(' src --include='*.ts' | no_spec)"

section "A6 Log fora do ILoggerGateway"
print_or_ok "$(grep -rnE 'console\.(log|error|warn|info|debug)\(|new Logger\(' src --include='*.ts' | no_spec)"

# B. Nomes, lugares e schema

section "B1 Adapter Prisma com arquivo fora de <modulo>-prisma.dao.ts ou .repository.ts, ou classe fora de XxxDaoAdapterPrisma e XxxRepositoryAdapterPrisma"
out=$(grep -rnE 'export class [A-Za-z]+' src/app --include='*.ts' | no_spec | awk -F: '$1 ~ /\/infra\/driven\/persistence\/prisma\//' | grep -vE 'class [A-Za-z]+(DaoAdapterPrisma|RepositoryAdapterPrisma)([^A-Za-z]|$)')
for file in $(find src/app -path '*/infra/driven/persistence/prisma/*' -name '*.ts' ! -name '*.spec.ts' | sort); do
  module=$(printf '%s' "$file" | cut -d/ -f3)
  case "$(basename "$file")" in
    "$module-prisma.dao.ts"|"$module-prisma.repository.ts") ;;
    *) out="$out"$'\n'"$file: nome fora de $module-prisma.dao.ts e $module-prisma.repository.ts" ;;
  esac
done
print_or_ok "$out"

section "B2 Use case com sufixo Service no nome da classe"
print_or_ok "$(grep -rnE 'export class [A-Za-z]+Service([^A-Za-z]|$)' src/app --include='*.service.ts' | grep '/application/usecases/')"

section "B3 Classe em application/usecases sem execute"
print_or_ok "$(find src/app -path '*/application/usecases/*' -name '*.service.ts' ! -name '*.spec.ts' -exec grep -L 'execute(' {} +)"

section "B4 Import relativo em src/app fora de domain/"
print_or_ok "$(grep -rnE "from '\.\.?/" src/app --include='*.ts' | no_spec | awk -F: '$1 !~ /\/domain\//')"

section "B5 Enum com valor fora de SCREAMING_SNAKE ou diferente do membro"
print_or_ok "$(find src/app -path '*/domain/enums/*.enum.ts' -exec awk '
  /=/ {
    line = $0
    gsub(/[[:space:],]/, "", line)
    split(line, parts, "=")
    value = parts[2]
    gsub(/\047/, "", value)
    if (value !~ /^[A-Z0-9_]+$/ || parts[1] != value) print FILENAME ":" FNR ": " $0
  }' {} +)"

section "B6 enum nativo do Prisma"
print_or_ok "$(grep -rnE '^enum ' prisma/schema)"

section "B7 Coluna Decimal, Float ou Json (fora da receita)"
print_or_ok "$(grep -rnE '[[:space:]](Decimal|Float|Json)(\?|\[\])?([[:space:]]|$)' prisma/schema)"

section "B8 @relation (verificar: só no caso tabela no lugar de enum)"
print_or_ok "$(grep -rn '@relation' prisma/schema)"

section "B9 Soft delete"
print_or_ok "$(grep -rniE 'deletedAt|isDeleted' prisma/schema src --include='*.prisma' --include='*.ts' | no_spec)"

# C. HTTP

section "C1 Decorator @Api* solto no controller"
print_or_ok "$(grep -rnE '@Api[A-Z][A-Za-z]*\(' src/app --include='*.controller.ts')"

section "C2 Controller com regra: if, else, switch ou instrução que não é return this.<useCase>.execute(...)"
print_or_ok "$( (
  grep -rnE '^[[:space:]]+(if|else|switch)([^A-Za-z]|$)' src/app --include='*.controller.ts'
  find src/app -name '*.controller.ts' -exec awk '
    /^  [^ @\/].*\{$/ { body = 1; next }
    /^  \}/ { body = 0; next }
    body && /^    [^ \/})]/ && $0 !~ /^    return this\.[A-Za-z]+\.execute\(/ { print FILENAME ":" FNR ":" $0 }
  ' {} +
) | sort -u)"

section "C3 URL fora de admin/<plural>, user/<plural> ou auth (verificar plural irregular)"
print_or_ok "$(grep -rnE '@Controller\(' src/app --include='*.controller.ts' | grep -vE "@Controller\('(admin|user)/[a-z-]+s'\)|@Controller\('auth'\)")"

section "C4 Mais de uma tag Swagger no mesmo módulo, ou tag com prefixo de canal"
out=""
for dir in src/app/*/; do
  tags=$(grep -rhoE "tags: \[[^]]*\]" "$dir" --include='*.controller.ts' | sort -u)
  count=$(printf '%s' "$tags" | grep -c . || true)
  if [ "$count" -gt 1 ]; then
    out="$out$dir: $(printf '%s' "$tags" | tr '\n' ' ')"$'\n'
  fi
done
out="$out$(grep -rnE "tags: \[[^]]*(Portal Gerencial|Aplicativo|Público)" src/app --include='*.controller.ts')"
print_or_ok "$out"

section "C5 @Put (verificar: só quando o body substitui o recurso inteiro)"
print_or_ok "$(grep -rn '@Put(' src/app --include='*.controller.ts')"

# D. DTO e erro

section "D1 PartialType"
print_or_ok "$(grep -rn 'PartialType' src --include='*.ts' | no_spec)"

section "D2 Segundo Params, Queries ou SuccessMessage; QueryDto sem extends Queries; id, page, size ou search em DTO de input ou de query"
print_or_ok "$(
  grep -rnE 'export class (Params|Queries|SuccessMessage)([^A-Za-z]|$)' src --include='*.ts' | grep -vE '^src/infra/validators/class/dtos/|^src/core/dtos/'
  find src/app -name '*.dto.ts' -exec awk '
    /^export class / {
      checked = ($3 ~ /(InputDto|QueryDto)$/ || $0 ~ /extends Queries/)
      if ($3 ~ /QueryDto$/ && $0 !~ /extends Queries/) print FILENAME ":" FNR ": " $3 " não estende Queries"
      next
    }
    checked && /^  (readonly )?(id|page|size|search)[?!]?:/ { print FILENAME ":" FNR ": " $0 }
  ' {} +
)"

section "D3 Mensagem fora do padrão ('deve ser um texto')"
print_or_ok "$(grep -rn 'deve ser um texto' src --include='*.ts')"

section "D4 Validação de formato no DTO (verificar: o VO valida e-mail, CPF, CNPJ, telefone, CEP)"
print_or_ok "$(grep -rnE '@IsEmail\(|@Matches\(' src/app --include='*.dto.ts' | grep -v 'd{4}-')"

section "D5 Documento na mensagem de erro"
print_or_ok "$(grep -rnE '\$\{(document|cpf|cnpj)|(document|cpf|cnpj)[[:space:]]*\+|\+[[:space:]]*(document|cpf|cnpj)' src --include='*.error.ts')"

# E. Registro, sobras, ambiente e spec

section "E1 Chave de TOKENS sem uso fora de spec"
out=""
for key in $(grep -oE '^[[:space:]]+[A-Za-z]+:' src/core/di/token.ts | tr -d ' :'); do
  used=$(grep -rlE "TOKENS\.$key([^A-Za-z0-9_]|$)" src --include='*.ts' | no_spec | head -1)
  if [ -z "$used" ]; then
    out="$out$key"$'\n'
  fi
done
print_or_ok "$out"

section "E2 Literal da union Resource sem setResource fora de spec"
out=""
for lit in $(sed -n '/^type Resource =/,/^$/p' src/infra/cache/helpers/cache-key/cache-key.builder.ts | grep -oE "'[a-z-]+'" | tr -d "'"); do
  used=$(grep -rlE "setResource\('$lit'\)" src --include='*.ts' | no_spec | head -1)
  if [ -z "$used" ]; then
    out="$out'$lit'"$'\n'
  fi
done
print_or_ok "$out"

section "E3 Model Prisma sem uso no código e sem relação com outro model"
out=""
for model in $(grep -hoE '^model [A-Za-z]+' prisma/schema/*.prisma | awk '{print $2}'); do
  camel="$(printf '%s' "${model:0:1}" | tr 'A-Z' 'a-z')${model:1}"
  used=$(grep -rlE "prisma\.$camel\." src prisma/seeds --include='*.ts' | no_spec | head -1)
  referenced=$(grep -rhE "[[:space:]]$model(\[\])?\??([[:space:]]|$)" prisma/schema | grep -vE "^model $model " | head -1)
  if [ -z "$used$referenced" ]; then
    out="$out$model"$'\n'
  fi
done
print_or_ok "$out"

section "E4 Banco de teste igual ao de desenvolvimento"
if [ -f .env.development ] && [ -f .env.test ]; then
  dev=$(grep -E '^DATABASE_URL=' .env.development | sed -E 's#^.*@##')
  test=$(grep -E '^DATABASE_URL=' .env.test | sed -E 's#^.*@##')
  if [ "$dev" = "$test" ]; then
    echo "mesmo banco: $dev"
  else
    echo ok
  fi
else
  echo "não verificado: .env.development ou .env.test ausente"
fi

section "E5 Spec que toca o banco com nome de unitário"
print_or_ok "$(grep -rlE 'deleteMany\(|\$disconnect\(' src --include='*.spec.ts' | grep -v '\.integration\.spec\.ts$')"

section "E6 Arquivo de produção sem o spec esperado (verificar: classe sem decisão dispensa spec)"
out=""
while IFS= read -r file; do
  [ -n "$file" ] || continue
  [ -f "${file%.ts}.spec.ts" ] || out="$out$file -> ${file%.ts}.spec.ts"$'\n'
done <<EOF
$(find src -type f -name '*.ts' ! -name '*.spec.ts' \( -path '*/application/usecases/*.service.ts' -o -name '*.controller.ts' -o -path '*/application/usecases/*/dtos/*.dto.ts' -o -path '*/domain/entities/*.entity.ts' -o -path '*/domain/factories/*.factory.ts' -o -name '*.vo.ts' -o -path 'src/infra/validators/class/decorators/*' -o -name '*.guard.ts' -o -name '*.filter.ts' -o -path 'src/infra/*/adapters/*/*.gateway.ts' \) | sort)
EOF
while IFS= read -r file; do
  [ -n "$file" ] || continue
  [ -f "${file%.ts}.integration.spec.ts" ] || out="$out$file -> ${file%.ts}.integration.spec.ts"$'\n'
done <<EOF
$(find src -type f \( -name '*-prisma.dao.ts' -o -name '*-prisma.repository.ts' \) | sort)
EOF
print_or_ok "$out"

section "E7 Erro lançado pelo arquivo sem caso no spec dele (verificar)"
out=""
for file in $(grep -rlE 'throw new [A-Z][A-Za-z]*Error\(' src --include='*.ts' | no_spec | sort); do
  specs=""
  for spec in "${file%.ts}.spec.ts" "${file%.ts}.integration.spec.ts"; do
    [ -f "$spec" ] && specs="$specs $spec"
  done
  [ -n "$specs" ] || continue
  for error in $(grep -oE 'throw new [A-Z][A-Za-z]*Error' "$file" | awk '{ print $3 }' | sort -u); do
    grep -qw "$error" $specs || out="$out$file: $error"$'\n'
  done
done
print_or_ok "$out"

# M. Comportamento. M2, M5 e M12 não têm checagem: só a leitura confere.

section "M1 Senha, token ou documento no select de método que não devolve WithSensitiveData (verificar)"
print_or_ok "$(find src/app -path '*/infra/driven/persistence/prisma/*' -name '*.ts' ! -name '*.spec.ts' -exec awk '
  BEGIN { secret = "^(password[A-Za-z]*|[A-Za-z]*[Tt]oken|secret[A-Za-z]*|document|cpf|cnpj)$" }
  FNR == 1 { split("", sensitive); inconst = 0; ret = "" }
  /^(export )?const [A-Za-z_]+ = \{/ {
    inconst = 1
    name = $0
    sub(/^(export )?const /, "", name)
    sub(/ =.*/, "", name)
    next
  }
  inconst && /^\}/ { inconst = 0; next }
  inconst {
    line = $0
    gsub(/[[:space:],]/, "", line)
    if (substr(line, 1, 3) == "..." && (substr(line, 4) in sensitive)) sensitive[name] = 1
    split(line, kv, ":")
    if (kv[1] ~ secret && kv[2] == "true") sensitive[name] = 1
    next
  }
  /\): *Promise</ { ret = $0; sub(/.*Promise</, "", ret) }
  /select: *[A-Za-z_]+/ {
    ref = $0
    sub(/.*select: */, "", ref)
    sub(/[^A-Za-z_].*/, "", ref)
    if ((ref in sensitive) && ret !~ /WithSensitiveData/) print FILENAME ":" FNR ": " $0
  }
  /^[[:space:]]+[A-Za-z]+: *true/ {
    line = $0
    gsub(/[[:space:],]/, "", line)
    split(line, kv, ":")
    if (kv[1] ~ secret && ret !~ /WithSensitiveData/) print FILENAME ":" FNR ": " $0
  }
' {} +)"

section "M3 findById: porta sem null, ou use case exposto por HTTP sem NotFound (verificar)"
out=$(grep -rnE 'findById\(.*\): *Promise<' src/app --include='*.interface.ts' | grep -v '| *null')
for file in $(grep -rlE '\.findById\(' src/app --include='*.service.ts' | no_spec | sort); do
  class=$(grep -oE 'export class [A-Za-z]+' "$file" | awk '{ print $3 }')
  if grep -rqw "$class" src/app --include='*.controller.ts' && ! grep -qE 'throw new [A-Za-z]*NotFound[A-Za-z]*Error' "$file"; then
    out="$out"$'\n'"$file: $class responde por HTTP e não lança NotFound"
  fi
done
print_or_ok "$out"

section "M4 Spread em use case, factory ou entidade (verificar: edição parcial sem { ...atual, ...dto })"
print_or_ok "$(grep -rnE '\.\.\.[A-Za-z_]' src/app --include='*.ts' | no_spec | awk -F: '$1 ~ /\/application\/usecases\/|\/domain\/(factories|entities)\//')"

section "M6 Lista: findMany sem Promise.all ou paginationFactory; findAll da porta sem [Dto[], number]; use case de lista sem Pagination (verificar)"
out=""
for file in $(grep -rlE '\.findMany\(' src/app --include='*.ts' | no_spec | sort); do
  grep -q 'Promise\.all(' "$file" || out="$out$file: findMany sem Promise.all"$'\n'
  grep -q 'paginationFactory(' "$file" || out="$out$file: findMany sem paginationFactory"$'\n'
done
out="$out$(grep -rnE 'findAll\(.*\): *Promise<' src/app --include='*.interface.ts' | grep -vE 'Promise<\[[A-Za-z]+\[\], *number\]>')"$'\n'
for file in $(grep -rlE '\.findAll\(' src/app --include='*.service.ts' | no_spec | sort); do
  grep -q 'new Pagination(' "$file" || out="$out$file: lista sem Pagination"$'\n'
done
print_or_ok "$out"

section "M7 Retorno: create sem <Xxx>OutputDto; edit, update ou delete sem SuccessMessage"
out=""
for file in $(find src/app -path '*/application/usecases/*' -name '*.service.ts' ! -name '*.spec.ts' | sort); do
  signature=$(awk '/execute\(/ { found = 1 } found { printf "%s", $0 } found && /\{[[:space:]]*$/ { exit }' "$file")
  case "$(basename "$file")" in
    create-*)
      printf '%s' "$signature" | grep -qE 'Promise<[A-Za-z]*OutputDto>' || out="$out$file: create sem OutputDto"$'\n' ;;
    edit-*|update-*|delete-*|remove-*)
      printf '%s' "$signature" | grep -q 'Promise<SuccessMessage>' || out="$out$file: sem SuccessMessage"$'\n' ;;
  esac
done
print_or_ok "$out"

section "M8 Campo @unique sem existsBy<Campo> na porta do módulo que cria ou edita (verificar)"
out=""
for pair in $(awk '/^model / { model = $2 } /^  [a-z][A-Za-z]* .*@unique/ && $1 != "id" && $1 !~ /Id$/ { print model ":" $1 }' prisma/schema/*.prisma); do
  model=${pair%%:*}
  field=${pair#*:}
  dir="src/app/$(kebab "$model")"
  writer=$(find "$dir/application/usecases" -maxdepth 1 -type d \( -name 'create-*' -o -name 'edit-*' -o -name 'update-*' \) 2>/dev/null | head -1)
  [ -n "$writer" ] || continue
  method="existsBy$(printf '%s' "${field:0:1}" | tr 'a-z' 'A-Z')${field:1}"
  grep -rq "$method" "$dir/application/persistence" 2>/dev/null || out="$out$model.$field: sem $method na porta de $dir"$'\n'
done
print_or_ok "$out"

section "M9 Escrita em recurso com leitura cacheada sem invalidar o cache (verificar)"
out=""
for reader in $(grep -rlE 'cacheGateway\.get' src/app --include='*.ts' | no_spec | sort); do
  grep -q 'cacheGateway\.set' "$reader" || continue
  for resource in $(grep -oE "setResource\('[a-z-]+'\)" "$reader" | grep -oE "'[a-z-]+'" | tr -d "'" | sort -u); do
    dir="src/app/$resource/application/usecases"
    [ -d "$dir" ] || continue
    for usecase in $(find "$dir" -name '*.service.ts' ! -name '*.spec.ts' | sort); do
      writes=$(grep -oE 'this\.[A-Za-z]+(Dao|Repository)\.[a-zA-Z]+\(' "$usecase" | sed -E 's/.*\.([a-zA-Z]+)\($/\1/' | grep -vE '^(find|exists|count|get|list)')
      [ -n "$writes" ] || continue
      if ! grep -q "setResource('$resource')" "$usecase" || ! grep -qE 'cacheGateway\.(delete|deleteContaining)\(' "$usecase"; then
        out="$out$usecase: grava $resource, que $reader cacheia, sem invalidar o cache"$'\n'
      fi
    done
  done
done
print_or_ok "$out"

section "M10 Import de porta, DAO, adapter, entidade, factory, módulo de persistência ou token de outro módulo; import circular; forwardRef"
out=""
for a in $MODULES; do
  for b in $MODULES; do
    [ "$a" = "$b" ] && continue
    out="$out$(grep -rnE "from '(src/app/$b/|(\.\./)+$b/)(application/persistence/|infra/|domain/entities/|domain/factories/)" "src/app/$a" --include='*.ts' | no_spec)"$'\n'
    out="$out$(grep -rnE "TOKENS\.$(pascal "$b")(Dao|Repository)([^A-Za-z]|$)" "src/app/$a" --include='*.ts' | no_spec)"$'\n'
    if [[ "$a" < "$b" ]]; then
      ab=$(grep -rlE "from '(src/app/$b/|(\.\./)+$b/)" "src/app/$a" --include='*.ts' | no_spec | head -1)
      ba=$(grep -rlE "from '(src/app/$a/|(\.\./)+$a/)" "src/app/$b" --include='*.ts' | no_spec | head -1)
      [ -n "$ab" ] && [ -n "$ba" ] && out="$out$a e $b se importam: $ab, $ba"$'\n'
    fi
  done
done
out="$out$(grep -rn 'forwardRef(' src/app --include='*.ts' | no_spec)"
print_or_ok "$out"

section "M11 Registro: módulo com controller fora do AppModule; módulo sem controller no AppModule ou sem exports"
out=""
for file in src/app/*/*.module.ts; do
  [ -f "$file" ] || continue
  class=$(grep -oE 'export class [A-Za-z]+' "$file" | awk '{ print $3 }')
  if grep -q 'controllers:' "$file"; then
    grep -qw "$class" src/app.module.ts || out="$out$file: $class tem controller e está fora do AppModule"$'\n'
  else
    grep -qw "$class" src/app.module.ts && out="$out$file: $class não tem controller e está no AppModule"$'\n'
    grep -q 'exports:' "$file" || out="$out$file: $class não tem controller nem exports"$'\n'
  fi
done
print_or_ok "$out"

section "M13 Tipos de campo (verificar): Date sem @IsDate e @StringToDate; número ou booleano da query sem StringToNumber ou StringToBoolean; <x>Id sem @IsUUID('4'); lista sem @IsArray; objeto aninhado; coluna <x>Id sem índice"
print_or_ok "$(
  find src/app -name '*.dto.ts' -exec awk '
    /^export class / {
      checked = ($3 ~ /(InputDto|QueryDto)$/ || $0 ~ /extends Queries/)
      query = ($3 ~ /QueryDto$/ || $0 ~ /extends Queries/)
      buffer = ""
      next
    }
    checked && /^  (readonly )?[A-Za-z]+[?!]?: [^;]+;[[:space:]]*$/ {
      line = $0
      sub(/^  (readonly )?/, "", line)
      name = line
      sub(/[?!]?:.*/, "", name)
      type = line
      sub(/^[A-Za-z]+[?!]?: /, "", type)
      sub(/;.*/, "", type)
      where = FILENAME ":" FNR ": " name
      if (type ~ /^Date/ && (buffer !~ /@IsDate\(/ || buffer !~ /@StringToDate\(/)) print where " é Date sem @IsDate e @StringToDate"
      if (query && type ~ /^number/ && buffer !~ /@StringToNumber\(/) print where " é número da query sem @StringToNumber"
      if (query && type ~ /^boolean/ && buffer !~ /@StringToBoolean\(/) print where " é booleano da query sem @StringToBoolean"
      if (name ~ /.Id$/ && buffer !~ /@IsUUID\(.4./) print where " é id de outro módulo sem @IsUUID(4)"
      if (type ~ /\[\]/ && buffer !~ /@IsArray\(/) print where " é lista sem @IsArray"
      buffer = ""
      next
    }
    checked { buffer = buffer $0 "\n" }
  ' {} +
  grep -rnE '@ValidateNested\(' src/app --include='*.dto.ts'
  awk '
    /^model / { model = $2; split("", fields); split("", indexed); next }
    /^\}/ && model != "" {
      for (field in fields) if (!(field in indexed)) print FILENAME ":" fields[field] ": " model "." field " sem índice"
      model = ""
      next
    }
    model != "" && /^  [a-z][A-Za-z]*Id +String/ {
      fields[$1] = FNR
      if ($0 ~ /@id|@unique/) indexed[$1] = 1
      next
    }
    model != "" && /@@(index|unique|id)\(\[/ {
      first = $0
      sub(/.*\(\[/, "", first)
      sub(/[],].*/, "", first)
      gsub(/[[:space:]]/, "", first)
      indexed[first] = 1
    }
  ' prisma/schema/*.prisma
)"

section "M14 Lugar (verificar): pasta de módulo fora de kebab singular, ou com pasta além de domain, application e infra"
out=""
kebab_re='^[a-z][a-z0-9]*(-[a-z0-9]+)*$'
for dir in src/app/*/; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  [[ "$name" =~ $kebab_re ]] || out="$out$dir: nome fora de kebab"$'\n'
  case "$name" in *s) out="$out$dir: nome no plural?"$'\n' ;; esac
  for sub in "$dir"*/; do
    [ -d "$sub" ] || continue
    case "$(basename "$sub")" in
      domain|application|infra) ;;
      *) out="$out$sub: pasta fora de domain, application e infra"$'\n' ;;
    esac
  done
done
print_or_ok "$out"

section "M15 Token fora de Symbol.for('<Chave>') com o nome da chave, ou com prefixo I"
print_or_ok "$(awk -F"'" '/Symbol\.for\(/ {
  key = $0
  sub(/^[[:space:]]+/, "", key)
  sub(/:.*/, "", key)
  if (key != $2 || key ~ /^I[A-Z]/) print FILENAME ":" FNR ": " $0
}' src/core/di/token.ts)"

section "M16 Filter, pipe global ou interceptor além do filter global e do ValidationPipe do main.ts"
print_or_ok "$(
  grep -rnE '@Catch\(' src --include='*.ts' | no_spec | grep -v '^src/core/filters/http-exception/http-exception\.filter\.ts:'
  grep -rnE 'APP_FILTER' src --include='*.ts' | no_spec | grep -v '^src/core/filters/filter\.module\.ts:'
  grep -rnE 'APP_PIPE|APP_INTERCEPTOR|useGlobal(Filters|Interceptors)\(|@UseInterceptors\(|@UseFilters\(|implements +NestInterceptor' src --include='*.ts' | no_spec
  grep -rnE 'useGlobalPipes\(' src --include='*.ts' | no_spec | grep -v '^src/main\.ts:'
)"
