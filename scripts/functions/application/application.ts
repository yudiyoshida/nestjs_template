import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateDtoFile } from './dtos/generate-dto-file';
import { generateCreateUsecaseDtoFile } from './usecases/create-usecase/generate-create-usecase-dto-file';
import { generateCreateUsecaseFile } from './usecases/create-usecase/generate-create-usecase-file';
import { generateDeleteUsecaseFile } from './usecases/delete-usecase/generate-delete-usecase-file';
import { generateEditUsecaseDtoFile } from './usecases/edit-usecase/generate-edit-usecase-dto-file';
import { generateEditUsecaseFile } from './usecases/edit-usecase/generate-edit-usecase-file';
import { generateFindAllUsecaseDtoFile } from './usecases/find-all-usecase/generate-find-all-usecase-dto-file';
import { generateFindAllUsecaseFile } from './usecases/find-all-usecase/generate-find-all-usecase-file';
import { generateFindByIdUsecaseFile } from './usecases/find-by-id-usecase/generate-find-by-id-usecase-file';

export async function generateApplicationFiles(props: Props) {
  // Cria a pasta application.
  const applicationPath = path.join(props.modulePath, 'application');
  await fs.mkdir(applicationPath);

  // Cria a pasta application/dto.
  const dtoPath = path.join(applicationPath, 'dtos');
  await fs.mkdir(dtoPath);

  // Cria o arquivo DTO.
  await fs.writeFile(
    path.join(dtoPath, `${props.moduleName}.dto.ts`),
    generateDtoFile(props.moduleNamePascal)
  );

  // Cria a pasta application/usecases.
  const usecasesPath = path.join(applicationPath, 'usecases');
  await fs.mkdir(usecasesPath);


  // Cria a pasta application/usecases/create.
  const createPath = path.join(usecasesPath, `create-${props.moduleName}`);
  await fs.mkdir(createPath);
  await fs.writeFile(
    path.join(createPath, `create-${props.moduleName}.service.ts`),
    generateCreateUsecaseFile(props)
  );

  // Cria a pasta application/usecases/create/dtos.
  const createDtoPath = path.join(createPath, 'dtos');
  await fs.mkdir(createDtoPath);
  await fs.writeFile(
    path.join(createDtoPath, `create-${props.moduleName}.dto.ts`),
    generateCreateUsecaseDtoFile(props)
  );


  // Cria a pasta application/usecases/find-all.
  const findAllPath = path.join(usecasesPath, `find-all-${props.moduleName}`);
  await fs.mkdir(findAllPath);
  await fs.writeFile(
    path.join(findAllPath, `find-all-${props.moduleName}.service.ts`),
    generateFindAllUsecaseFile(props)
  );

  // Cria a pasta application/usecases/find-all/dtos.
  const findAllDtoPath = path.join(findAllPath, 'dtos');
  await fs.mkdir(findAllDtoPath);
  await fs.writeFile(
    path.join(findAllDtoPath, `find-all-${props.moduleName}.dto.ts`),
    generateFindAllUsecaseDtoFile(props)
  );


  // Cria a pasta application/usecases/find-by-id.
  const findByIdPath = path.join(usecasesPath, `find-${props.moduleName}-by-id`);
  await fs.mkdir(findByIdPath);
  await fs.writeFile(
    path.join(findByIdPath, `find-${props.moduleName}-by-id.service.ts`),
    generateFindByIdUsecaseFile(props)
  );


  // Cria a pasta application/usecases/edit.
  const editPath = path.join(usecasesPath, `edit-${props.moduleName}`);
  await fs.mkdir(editPath);
  await fs.writeFile(
    path.join(editPath, `edit-${props.moduleName}.service.ts`),
    generateEditUsecaseFile(props)
  );

  // Cria a pasta application/usecases/edit/dtos.
  const editDtoPath = path.join(editPath, 'dtos');
  await fs.mkdir(editDtoPath);
  await fs.writeFile(
    path.join(editDtoPath, `edit-${props.moduleName}.dto.ts`),
    generateEditUsecaseDtoFile(props)
  );


  // Cria a pasta application/usecases/delete.
  const deletePath = path.join(usecasesPath, `delete-${props.moduleName}`);
  await fs.mkdir(deletePath);
  await fs.writeFile(
    path.join(deletePath, `delete-${props.moduleName}.service.ts`),
    generateDeleteUsecaseFile(props)
  );
}
