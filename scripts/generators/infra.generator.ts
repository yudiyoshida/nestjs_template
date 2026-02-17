import * as path from 'path';
import type { Props } from '../config';
import { writeGeneratedFile } from '../utils/fs';
import { renderTemplate } from '../utils/render';

function getContext(props: Props) {
  return {
    moduleName: props.moduleName,
    moduleNamePascal: props.moduleNamePascal,
    moduleNameCamel: props.moduleNameCamel,
  };
}

export async function generateInfra(props: Props): Promise<void> {
  const ctx = getContext(props);

  // HTTP Controller
  const httpPath = path.join(props.modulePath, 'infra', 'drivers', 'http');
  await writeGeneratedFile(
    path.join(httpPath, `${props.moduleName}.controller.ts`),
    renderTemplate('infra/controller.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(httpPath, `${props.moduleName}.controller.spec.ts`),
    renderTemplate('infra/controller-spec.hbs', ctx)
  );

  // Persistence DAO
  const persistencePath = path.join(props.modulePath, 'infra', 'driven', 'persistence');
  await writeGeneratedFile(
    path.join(persistencePath, `${props.moduleName}.dao.ts`),
    renderTemplate('infra/dao.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(persistencePath, `${props.moduleName}.dao.spec.ts`),
    renderTemplate('infra/dao-spec.hbs', ctx)
  );
}
