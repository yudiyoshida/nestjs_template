import * as fs from 'fs/promises';
import * as path from 'path';
import type { Props } from './config';
import { generateModuleFiles } from './generators';
import { kebabToCamelCase, kebabToPascalCase } from './utils/naming';

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Erro. Uso correto: npx ts-node scripts/cli.ts <nome-do-modulo>');
  process.exit(1);
}

const moduleName = args[0];
const projectRoot = path.join(__dirname, '..');
const modulePath = path.join(projectRoot, 'src', 'app', moduleName);

const props: Props = {
  modulePath,
  moduleName,
  moduleNamePascal: kebabToPascalCase(moduleName),
  moduleNameCamel: kebabToCamelCase(moduleName),
  moduleNameUpper: moduleName.toUpperCase(),
};

async function main() {
  try {
    await fs.access(modulePath);
    console.error(`Erro! O módulo "${moduleName}" já existe.`);
    process.exit(1);
  } catch {
    // Módulo não existe, segue o fluxo
  }

  await fs.mkdir(modulePath);
  await generateModuleFiles(props);
  console.log(`Módulo "${moduleName}" criado com sucesso.`);
}

main().catch((err) => {
  console.error('Erro ao gerar módulo:', err);
  process.exit(1);
});
