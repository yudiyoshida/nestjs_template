import * as path from 'path';
import type { Props } from '../config';
import { VALIDATORS_PATH } from '../config';
import { writeGeneratedFile } from '../utils/fs';
import { renderTemplate } from '../utils/render';

function getContext(props: Props) {
  return {
    moduleName: props.moduleName,
    moduleNamePascal: props.moduleNamePascal,
    moduleNameCamel: props.moduleNameCamel,
    validatorsPath: VALIDATORS_PATH,
    field: 'field',
  };
}

export async function generateApplication(props: Props): Promise<void> {
  const ctx = getContext(props);
  const appPath = path.join(props.modulePath, 'application');

  // DTOs
  await writeGeneratedFile(
    path.join(appPath, 'dtos', `${props.moduleName}.dto.ts`),
    renderTemplate('application/dto.hbs', ctx)
  );

  // Persistence
  const persistencePath = path.join(appPath, 'persistence');
  await writeGeneratedFile(
    path.join(persistencePath, `${props.moduleName}-persistence.module.ts`),
    renderTemplate('application/persistence-module.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(persistencePath, 'dao', `${props.moduleName}-dao.interface.ts`),
    renderTemplate('application/dao-interface.hbs', ctx)
  );

  // Use cases
  const usecasesPath = path.join(appPath, 'usecases');

  // Create
  const createPath = path.join(usecasesPath, `create-${props.moduleName}`);
  await writeGeneratedFile(
    path.join(createPath, `create-${props.moduleName}.service.ts`),
    renderTemplate('application/usecases/create-service.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(createPath, `create-${props.moduleName}.service.spec.ts`),
    renderTemplate('application/usecases/create-service-spec.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(createPath, 'dtos', `create-${props.moduleName}.dto.ts`),
    renderTemplate('application/usecases/create-dto.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(createPath, 'dtos', `create-${props.moduleName}-dto.spec.ts`),
    renderTemplate('application/usecases/create-dto-spec.hbs', ctx)
  );

  // Edit
  const editPath = path.join(usecasesPath, `edit-${props.moduleName}`);
  await writeGeneratedFile(
    path.join(editPath, `edit-${props.moduleName}.service.ts`),
    renderTemplate('application/usecases/edit-service.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(editPath, `edit-${props.moduleName}.service.spec.ts`),
    renderTemplate('application/usecases/edit-service-spec.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(editPath, 'dtos', `edit-${props.moduleName}.dto.ts`),
    renderTemplate('application/usecases/edit-dto.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(editPath, 'dtos', `edit-${props.moduleName}-dto.spec.ts`),
    renderTemplate('application/usecases/edit-dto-spec.hbs', ctx)
  );

  // Delete
  const deletePath = path.join(usecasesPath, `delete-${props.moduleName}`);
  await writeGeneratedFile(
    path.join(deletePath, `delete-${props.moduleName}.service.ts`),
    renderTemplate('application/usecases/delete-service.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(deletePath, `delete-${props.moduleName}.service.spec.ts`),
    renderTemplate('application/usecases/delete-service-spec.hbs', ctx)
  );

  // Find All
  const findAllPath = path.join(usecasesPath, `find-all-${props.moduleName}`);
  await writeGeneratedFile(
    path.join(findAllPath, `find-all-${props.moduleName}.service.ts`),
    renderTemplate('application/usecases/find-all-service.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(findAllPath, `find-all-${props.moduleName}.service.spec.ts`),
    renderTemplate('application/usecases/find-all-service-spec.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(findAllPath, 'dtos', `find-all-${props.moduleName}.dto.ts`),
    renderTemplate('application/usecases/find-all-dto.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(findAllPath, 'dtos', `find-all-${props.moduleName}-dto.spec.ts`),
    renderTemplate('application/usecases/find-all-dto-spec.hbs', ctx)
  );

  // Find By Id
  const findByIdPath = path.join(usecasesPath, `find-${props.moduleName}-by-id`);
  await writeGeneratedFile(
    path.join(findByIdPath, `find-${props.moduleName}-by-id.service.ts`),
    renderTemplate('application/usecases/find-by-id-service.hbs', ctx)
  );
  await writeGeneratedFile(
    path.join(findByIdPath, `find-${props.moduleName}-by-id.service.spec.ts`),
    renderTemplate('application/usecases/find-by-id-service-spec.hbs', ctx)
  );
}
