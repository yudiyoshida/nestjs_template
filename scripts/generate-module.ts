import * as fs from 'fs/promises';
import * as path from 'path';
import { generateApplicationFiles } from './functions/application/application';
import { generateDomainFiles } from './functions/domain/domain';
import { generateModuleFile } from './functions/generate-module-file';
import { generateInfraFiles } from './functions/infra/infra';
import { kebabToCamelCase } from './utils/kebab-to-camel';
import { kebabToPascalCase } from './utils/kebab-to-pascal';

export type Props = {
  modulePath: string;
  moduleName: string;
  moduleNamePascal: string;
  moduleNameCamel: string;
}

// Execução.
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Erro. Uso correto: npx ts-node scripts/generate-module.ts <nome-do-modulo>');
  process.exit(1);
}

main(args[0]);
// --

async function main(moduleName: string) {
  const props: Props = {
    modulePath: path.join(__dirname, '..', 'src', 'modules', moduleName),
    moduleName,
    moduleNamePascal: kebabToPascalCase(moduleName),
    moduleNameCamel: kebabToCamelCase(moduleName),
  };

  // Caso consiga acessar a pasta, significa que o módulo já existe.
  try {
    await fs.access(props.modulePath);
    return console.error(`Erro! O módulo "${moduleName}" já existe.`);
  }
  catch (err) {
    // O módulo não existe, então segue o fluxo.
  }

  // Cria a pasta do módulo.
  await fs.mkdir(props.modulePath);

  // Cria o arquivo do módulo.
  await fs.writeFile(
    path.join(props.modulePath, `${props.moduleName}.module.ts`),
    generateModuleFile(props)
  );

  await generateApplicationFiles(props);
  await generateDomainFiles(props);
  await generateInfraFiles(props);
}
