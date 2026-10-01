#!/usr/bin/env node
// Valida skills do projeto contra o esqueleto definido em creating-skills/SKILL.md.
// Uso, na raiz do repositório:
//   node .agents/skills/creating-skills/scripts/validate-skill.mjs <nome> [<nome>...]
//   node .agents/skills/creating-skills/scripts/validate-skill.mjs --all
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_DESCRIPTION_LENGTH = 1024;
const MAX_LINES = 500;
const MIN_CHECKLIST_ITEMS = 3;
const NAME_FORMAT = /^[a-z]+ing-[a-z0-9]+(-[a-z0-9]+)*$/;
const SOURCE_OF_TRUTH = 'Esta skill é a única fonte da verdade';
const TOOL_DIRS = ['.claude/skills', '.cursor/skills'];
const PATH_PATTERN = /\b(?:src|test|prisma|resources)\/[^\s`'"),;|]*/g;
const EXAMPLES_PATTERN = /src\/app\/_examples\/[A-Za-z][^\s`'"),;|]*/g;
const FICTIONAL_PREFIXES = ['src/app/product', 'src/path/to'];

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const skillsDir = join(root, '.agents', 'skills');

const args = process.argv.slice(2);
const names = args[0] === '--all' ? listSkillDirs() : args;

if (!names.length) {
  console.error('uso: node .agents/skills/creating-skills/scripts/validate-skill.mjs <nome> [<nome>...] | --all');
  process.exit(2);
}

let failed = 0;
for (const name of names) {
  const result = validate(name);
  print(name, result);
  if (result.errors.length) {
    failed++;
  }
}
process.exit(failed ? 1 : 0);

function validate(name) {
  const errors = [];
  const warnings = [];
  const file = join(skillsDir, name, 'SKILL.md');

  if (!NAME_FORMAT.test(name) || name.length > 64) {
    errors.push(`nome "${name}": gerúndio em inglês + objeto, kebab-case, até 64 caracteres (ex.: creating-use-cases)`);
  }

  if (existsSync(file)) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    const body = markFences(checkFrontmatter(name, lines, errors));
    checkTitle(name, body, errors);
    checkSections(body, errors, warnings);
    checkReferences(body, errors);
    checkPaths(body, errors);
    if (lines.length > MAX_LINES) {
      warnings.push(`${lines.length} linhas (alvo abaixo de ${MAX_LINES}): mover detalhe para references/`);
    }
  }
  else {
    errors.push(`não existe .agents/skills/${name}/SKILL.md`);
  }

  checkSymlinks(name, errors);

  return { errors, warnings };
}

function checkFrontmatter(name, lines, errors) {
  if (lines[0] !== '---') {
    errors.push('SKILL.md deve começar com o frontmatter ("---")');
    return lines;
  }

  const end = lines.indexOf('---', 1);
  if (end === -1) {
    errors.push('frontmatter sem "---" de fechamento');
    return lines;
  }

  const fields = {};
  let multiline = false;
  for (const line of lines.slice(1, end)) {
    const match = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (match) {
      fields[match[1]] = unquote(match[2].trim());
    }
    else if (line.trim()) {
      multiline = true;
    }
  }

  if (multiline) {
    errors.push('frontmatter: cada campo em uma linha só ("chave: valor")');
  }

  const keys = Object.keys(fields).sort().join(', ');
  if (keys !== 'description, name') {
    errors.push(`frontmatter deve ter só name e description (tem: ${keys || 'nenhum campo'})`);
  }
  if (fields.name !== name) {
    errors.push(`frontmatter name "${fields.name ?? ''}" diferente da pasta "${name}"`);
  }

  const description = fields.description ?? '';
  const length = [...description].length;
  if (!description || ['>', '>-', '|', '|-'].includes(description)) {
    errors.push('description vazia ou em bloco multilinha: usar uma linha');
    return lines.slice(end + 1);
  }
  if (length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`description com ${length} caracteres (máximo ${MAX_DESCRIPTION_LENGTH})`);
  }
  if (/[<>]/.test(description)) {
    errors.push('description não pode ter "<" nem ">"');
  }
  if (!description.includes('Use quando')) {
    errors.push('description precisa da frase "Use quando …" com os gatilhos');
  }

  return lines.slice(end + 1);
}

function unquote(value) {
  const quoted = value.match(/^(['"])(.*)\1$/);
  return quoted ? quoted[2] : value;
}

// Marca as linhas dentro de bloco de código. Fence fecha só com o mesmo caractere
// e tamanho maior ou igual ao da abertura, então blocos aninhados (```` com ``` dentro) funcionam.
function markFences(lines) {
  let fence = null;
  return lines.map((text) => {
    const marker = text.match(/^\s*(`{3,}|~{3,})/)?.[1];
    if (!fence && marker) {
      fence = marker;
      return { text, fenced: true };
    }
    if (fence && marker && marker[0] === fence[0] && marker.length >= fence.length && text.trim() === marker) {
      fence = null;
      return { text, fenced: true };
    }
    return { text, fenced: fence !== null };
  });
}

function checkTitle(name, body, errors) {
  const first = body.find((line) => line.text.trim());
  const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!first || !first.text.startsWith('# ') || normalize(first.text.slice(2)) !== normalize(name)) {
    errors.push(`primeira linha depois do frontmatter deve ser o título "# ${toTitle(name)}"`);
  }
}

function toTitle(name) {
  return name
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function checkSections(body, errors, warnings) {
  const headings = [];
  body.forEach((line, index) => {
    if (!line.fenced && line.text.startsWith('## ')) {
      headings.push({ title: line.text.slice(3).trim(), index });
    }
  });

  const position = (predicate) => headings.findIndex(predicate);
  const truth = position((heading) => heading.title === SOURCE_OF_TRUTH);
  const flow = position((heading) => heading.title === 'Fluxo');
  const when = position((heading) => heading.title.startsWith('Quando'));
  const redFlags = position((heading) => heading.title.startsWith('Red flags'));
  const outOfScope = position((heading) => heading.title === 'Fora do escopo');
  const checklist = position((heading) => heading.title === 'Checklist de entrega');

  const sectionText = (index) => {
    const start = headings[index].index + 1;
    const end = index + 1 < headings.length ? headings[index + 1].index : body.length;
    return body.slice(start, end).map((line) => line.text).join('\n');
  };

  if (truth === -1) {
    errors.push(`falta "## ${SOURCE_OF_TRUTH}" (em skill de reuso, a seção separa ler para reuso × copiar formato)`);
  }
  else if (truth !== 0) {
    errors.push(`"## ${SOURCE_OF_TRUTH}" deve ser a primeira seção`);
  }

  if (flow === -1) {
    errors.push('falta "## Fluxo"');
  }
  else {
    const text = sectionText(flow);
    if (!text.includes('Progresso:') || !/- \[ \] 1\./.test(text)) {
      errors.push('"## Fluxo" precisa do bloco "Progresso:" com passos "- [ ] 1. …"');
    }
  }

  if (when === -1) {
    errors.push('falta "## Quando usar" (ou "## Quando criar …")');
  }

  if (outOfScope === -1) {
    errors.push('falta "## Fora do escopo"');
  }
  else if (!/^\|\s*Artefato\s*\|\s*Delegar a\s*\|/m.test(sectionText(outOfScope))) {
    errors.push('"## Fora do escopo" precisa da tabela "| Artefato | Delegar a |"');
  }

  if (checklist === -1) {
    errors.push('falta "## Checklist de entrega"');
  }
  else {
    if (checklist !== headings.length - 1) {
      errors.push('"## Checklist de entrega" deve ser a última seção');
    }
    const items = (sectionText(checklist).match(/^\s*- \[ \] /gm) ?? []).length;
    if (items < MIN_CHECKLIST_ITEMS) {
      errors.push(`"## Checklist de entrega" com ${items} item(ns) (mínimo ${MIN_CHECKLIST_ITEMS})`);
    }
  }

  if (!isAscending([flow, when, outOfScope, checklist])) {
    errors.push('ordem das seções: Fluxo, Quando usar, …, Fora do escopo, Checklist de entrega');
  }
  if (redFlags !== -1 && outOfScope !== -1 && redFlags > outOfScope) {
    errors.push('"## Red flags" deve vir antes de "## Fora do escopo"');
  }
}

function isAscending(positions) {
  const present = positions.filter((value) => value !== -1);
  return present.every((value, index) => index === 0 || present[index - 1] < value);
}

// Só "skill `nome`" fora de bloco de código conta como referência.
function checkReferences(body, errors) {
  const missing = new Set();
  for (const line of body) {
    if (line.fenced) {
      continue;
    }
    for (const match of line.text.matchAll(/skills?\s+`([a-z0-9-]+)`/gi)) {
      const reference = match[1];
      if (NAME_FORMAT.test(reference) && !existsSync(join(skillsDir, reference, 'SKILL.md'))) {
        missing.add(reference);
      }
    }
  }
  for (const reference of missing) {
    errors.push(`cita skill inexistente "${reference}": usar "Fora (sem skill)"`);
  }
}

// Módulo de exemplo é proibido em qualquer lugar; caminho citado no texto (fora de bloco
// de código) precisa existir, exceto placeholder, glob e módulo fictício.
function checkPaths(body, errors) {
  const examples = new Set();
  const missing = new Set();
  for (const line of body) {
    for (const [reference] of line.text.matchAll(EXAMPLES_PATTERN)) {
      examples.add(reference);
    }
    if (line.fenced) {
      continue;
    }
    for (const [raw] of line.text.matchAll(PATH_PATTERN)) {
      const path = raw.replace(/[.:]+$/, '');
      const skip = /[<>*{}]|\.\.\./.test(path)
        || path.includes('_examples')
        || FICTIONAL_PREFIXES.some((prefix) => path.startsWith(prefix));
      if (!skip && !existsSync(join(root, path)) && !existsSync(join(root, `${path}.ts`))) {
        missing.add(path);
      }
    }
  }
  for (const reference of examples) {
    errors.push(`cita módulo de exemplo removível "${reference}": usar código permanente ou o módulo fictício product`);
  }
  for (const path of missing) {
    errors.push(`caminho citado não existe: "${path}"`);
  }
}

function checkSymlinks(name, errors) {
  const expected = `../../.agents/skills/${name}`;
  for (const dir of TOOL_DIRS) {
    const link = join(root, dir, name);
    let stats;
    try {
      stats = lstatSync(link);
    }
    catch {
      errors.push(`falta symlink ${dir}/${name} -> ${expected}`);
      continue;
    }
    if (!stats.isSymbolicLink()) {
      errors.push(`${dir}/${name} deve ser symlink, não cópia`);
    }
    else if (readlinkSync(link) !== expected) {
      errors.push(`${dir}/${name} aponta para "${readlinkSync(link)}" (esperado "${expected}")`);
    }
    else if (!existsSync(join(link, 'SKILL.md'))) {
      errors.push(`${dir}/${name} não resolve até SKILL.md`);
    }
  }
}

function listSkillDirs() {
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function print(name, { errors, warnings }) {
  const status = errors.length ? `${errors.length} erro(s)` : 'ok';
  const extra = warnings.length ? `, ${warnings.length} aviso(s)` : '';
  console.log(`${name}: ${status}${extra}`);
  for (const error of errors) {
    console.log(`  ERRO: ${error}`);
  }
  for (const warning of warnings) {
    console.log(`  AVISO: ${warning}`);
  }
}
