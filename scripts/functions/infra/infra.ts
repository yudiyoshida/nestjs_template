import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateControllerFile } from './http/generate-controller-file';
import { generateDaoFile } from './persistence/generate-dao-file';

export async function generateInfraFiles(props: Props) {
  // Cria a pasta infra.
  const infraPath = path.join(props.modulePath, 'infra');
  await fs.mkdir(infraPath);

  // Cria a pasta infra/http.
  const infraHttpPath = path.join(infraPath, 'http');
  await fs.mkdir(infraHttpPath);
  await fs.writeFile(
    path.join(infraHttpPath, `${props.moduleName}.controller.ts`),
    generateControllerFile(props)
  );

  // Cria a pasta infra/persistence.
  const infraPersistencePath = path.join(infraPath, 'persistence');
  await fs.mkdir(infraPersistencePath);
  await fs.writeFile(
    path.join(infraPersistencePath, `${props.moduleName}.dao.ts`),
    generateDaoFile(props)
  );
}
