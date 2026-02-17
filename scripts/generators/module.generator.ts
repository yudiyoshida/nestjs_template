import * as path from 'path';
import type { Props } from '../config';
import { writeGeneratedFile } from '../utils/fs';
import { renderTemplate } from '../utils/render';

export async function generateModule(props: Props): Promise<void> {
  const moduleFilePath = path.join(props.modulePath, `${props.moduleName}.module.ts`);
  const content = renderTemplate('module/module.hbs', {
    moduleName: props.moduleName,
    moduleNamePascal: props.moduleNamePascal,
  });
  await writeGeneratedFile(moduleFilePath, content);
}
