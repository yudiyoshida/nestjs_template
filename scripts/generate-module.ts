import * as fs from 'fs/promises';
import * as path from 'path';
import { convertToPascalCase } from './utils/convert-pascalcase';

// Execução.
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Erro. Uso correto: npx tsx scripts/generate-module.ts <nome-do-modulo>');
  process.exit(1);
}

main(args[0]);
// --

async function main(moduleName: string) {
  const modulePath = path.join(__dirname, '..', 'src', 'modules', moduleName);
  const entitiesPath = path.join(modulePath, 'entities');
  const repositoriesPath = path.join(modulePath, 'repositories');
  const repositoriesAdaptersPath = path.join(modulePath, 'repositories', 'adapters');
  const useCasesPath = path.join(modulePath, 'use-cases');

  // Caso consiga acessar a pasta, significa que o módulo já existe.
  try {
    await fs.access(modulePath);
    return console.error(`Erro! O módulo "${moduleName}" já existe.`);
  }
  catch (err) {
    // O módulo não existe, então segue o fluxo.
  }

  // Cria a pasta do módulo.
  await fs.mkdir(modulePath);

  // Cria a pasta entities.
  await fs.mkdir(entitiesPath);

  // Cria a classe entity em entities.
  await fs.writeFile(
    path.join(entitiesPath, `${moduleName}.entity.ts`),
    generateEntityContent(moduleName),
  );

  // Cria a pasta repositories.
  await fs.mkdir(repositoriesPath);

  // Cria a interface em repositories.
  await fs.writeFile(
    path.join(repositoriesPath, `${moduleName}-repository.interface.ts`),
    generateRepositoryInterfaceContent(moduleName),
  );

  // Cria a pasta adapters em repositories.
  await fs.mkdir(repositoriesAdaptersPath);
  await fs.writeFile(path.join(repositoriesAdaptersPath, '.gitkeep'), '');

  // Cria a pasta "use-cases".
  await fs.mkdir(useCasesPath);
  await fs.writeFile(path.join(useCasesPath, '.gitkeep'), '');

  // Cria o arquivo routes.
  await fs.writeFile(
    path.join(modulePath, `${moduleName}.routes.ts`),
    generateRouteContent(),
  );

  console.log(`Módulo "${moduleName}" criado com sucesso.`);
}

function generateEntityContent(module: string) {
  return `export class ${convertToPascalCase(module)} {}`;
}

function generateRepositoryInterfaceContent(module: string) {
  return `export interface I${convertToPascalCase(module)}Repository {}`;
}

function generateRouteContent() {
  return `import { Router } from 'express';

const router = Router();

const controller = new Controller();

router.post('/:id/approve', controller.handle);

export default router;  
`;
}
