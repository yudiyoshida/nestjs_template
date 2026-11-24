#!/usr/bin/env bash
# Conferência do catálogo de skills. Rodar na raiz do repositório:
#   bash .agents/skills/validating-project-skills/references/checks.sh
# Cada bloco imprime "### <id> <regra>" e, embaixo, as ocorrências ou "ok". Só lê arquivos.
set -u

SKILLS=.agents/skills

section() {
  printf '\n### %s\n' "$1"
}

print_or_ok() {
  local text="${1%$'\n'}"
  if [ -n "$text" ]; then
    printf '%s\n' "$text"
  else
    echo ok
  fi
}

skill_files() {
  for file in "$SKILLS"/*/SKILL.md "$SKILLS"/*/references/*.md; do
    [ -f "$file" ] && printf '%s\n' "$file"
  done
}

section "V1 Pasta sem SKILL.md ou name do frontmatter diferente da pasta"
out=""
for dir in "$SKILLS"/*/; do
  name=$(basename "$dir")
  file="${dir%/}/SKILL.md"
  if [ ! -f "$file" ]; then
    out="$out$name: sem SKILL.md"$'\n'
    continue
  fi
  fm_name=$(sed -n '1,6p' "$file" | grep -E '^name:' | sed -E 's/^name:[[:space:]]*//')
  [ "$fm_name" = "$name" ] || out="$out$name: name = '$fm_name'"$'\n'
done
print_or_ok "$out"

section "V2 description sem 'Use quando'"
out=""
for file in "$SKILLS"/*/SKILL.md; do
  grep -m1 -E '^description:' "$file" | grep -q 'Use quando' || out="$out$file"$'\n'
done
print_or_ok "$out"

section "V3 SKILL.md com 500 linhas ou mais"
out=""
for file in "$SKILLS"/*/SKILL.md; do
  lines=$(wc -l < "$file" | tr -d ' ')
  [ "$lines" -lt 500 ] || out="$out$file: $lines linhas"$'\n'
done
print_or_ok "$out"

section "V4 Seção obrigatória do molde ausente"
out=""
for file in "$SKILLS"/*/SKILL.md; do
  for heading in '## Esta skill é a única fonte da verdade' '## Fluxo' '## Quando usar' '### Quando não usar' '## Fora do escopo' '## Checklist de entrega'; do
    grep -qF -- "$heading" "$file" || out="$out$file: falta '$heading'"$'\n'
  done
done
print_or_ok "$out"

section "V5 Skill citada que não existe"
out=""
while IFS= read -r file; do
  for ref in $(grep -oE '[Ss]kills? `[a-z]+(-[a-z]+)+`((, | e )`[a-z]+(-[a-z]+)+`)*' "$file" | grep -oE '`[a-z]+(-[a-z]+)+`' | tr -d '`' | sort -u); do
    [ -d "$SKILLS/$ref" ] || out="$out$file: $ref"$'\n'
  done
done <<EOF
$(skill_files)
EOF
print_or_ok "$out"

section "V6 'planejada X' com X já criada"
out=$(grep -rnoE 'planejada [a-z]+(-[a-z]+)+' "$SKILLS" | while IFS=: read -r file line match; do
  name=${match#planejada }
  [ -d "$SKILLS/$name" ] && echo "$file:$line: $name já existe"
done)
print_or_ok "$out"

section "V7 Symlink ausente, quebrado ou cópia em .claude/skills e .cursor/skills"
out=""
for tool in .claude/skills .cursor/skills; do
  for dir in "$SKILLS"/*/; do
    name=$(basename "$dir")
    link="$tool/$name"
    if [ -L "$link" ]; then
      target=$(readlink "$link")
      [ "$target" = "../../.agents/skills/$name" ] || out="$out$link: aponta para $target"$'\n'
    elif [ -e "$link" ]; then
      out="$out$link: cópia, não symlink"$'\n'
    else
      out="$out$link: ausente"$'\n'
    fi
  done
  for entry in "$tool"/*; do
    [ -e "$entry" ] || [ -L "$entry" ] || continue
    name=$(basename "$entry")
    [ -d "$SKILLS/$name" ] || out="$out$entry: sem skill em $SKILLS"$'\n'
  done
done
print_or_ok "$out"

section "V8 Bloco de código sem fechar (número ímpar de cercas)"
out=""
while IFS= read -r file; do
  count=$(grep -cE '^[[:space:]]*```' "$file")
  [ $((count % 2)) -eq 0 ] || out="$out$file: $count cercas"$'\n'
done <<EOF
$(skill_files)
EOF
print_or_ok "$out"

section "V9 Skill que o create-new-feature não cita (verificar: skill meta ou de operação pode ficar fora)"
out=""
for dir in "$SKILLS"/*/; do
  name=$(basename "$dir")
  case "$name" in
    create-new-feature|creating-project-skills|validating-project-skills) continue ;;
  esac
  grep -qF "\`$name\`" "$SKILLS/create-new-feature/SKILL.md" || out="$out$name"$'\n'
done
print_or_ok "$out"

section "V10 Referência com mais de 300 linhas (verificar: precisa de índice no topo)"
out=""
for file in "$SKILLS"/*/references/*.md; do
  [ -f "$file" ] || continue
  lines=$(wc -l < "$file" | tr -d ' ')
  [ "$lines" -le 300 ] || out="$out$file: $lines linhas"$'\n'
done
print_or_ok "$out"
