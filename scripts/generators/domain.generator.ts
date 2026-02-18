import * as path from 'path';
import type { Props } from '../config';
import { TEMPLATES } from '../config';
import { writeGeneratedFile } from '../utils/fs';
import { renderTemplate } from '../utils/render';

const T = TEMPLATES.domain;

function getContext(props: Props) {
  return {
    moduleName: props.moduleName,
    moduleNamePascal: props.moduleNamePascal,
    moduleNameCamel: props.moduleNameCamel,
  };
}

export async function generateDomain(props: Props): Promise<void> {
  const domainPath = path.join(props.modulePath, 'domain');

  if (props.mode === 'simple') {
    const gitkeepPath = path.join(domainPath, '.gitkeep');
    await writeGeneratedFile(gitkeepPath, '');
    return;
  }

  const ctx = getContext(props);

  // Entities
  await writeGeneratedFile(
    path.join(domainPath, 'entities', `${props.moduleName}.entity.ts`),
    renderTemplate(T.entity, ctx)
  );
  await writeGeneratedFile(
    path.join(domainPath, 'entities', `${props.moduleName}.entity.spec.ts`),
    renderTemplate(T.entitySpec, ctx)
  );

  // Enums
  await writeGeneratedFile(
    path.join(domainPath, 'enums', `${props.moduleName}-status.enum.ts`),
    renderTemplate(T.enumStatus, ctx)
  );

  // Errors
  await writeGeneratedFile(
    path.join(domainPath, 'errors', `${props.moduleName}-not-found.error.ts`),
    renderTemplate(T.errorNotFound, ctx)
  );
  await writeGeneratedFile(
    path.join(domainPath, 'errors', `${props.moduleName}-already-exists.error.ts`),
    renderTemplate(T.errorAlreadyExists, ctx)
  );
}
