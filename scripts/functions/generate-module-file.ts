import { Props } from 'scripts/generate-module';

export function generateModuleFile({ moduleName, moduleNamePascal }: Props) {
  return `import { Module } from '@nestjs/common';
import { Create${moduleNamePascal} } from './application/usecases/create-${moduleName}/create-${moduleName}.service';
import { Delete${moduleNamePascal} } from './application/usecases/delete-${moduleName}/delete-${moduleName}.service';
import { Edit${moduleNamePascal} } from './application/usecases/edit-${moduleName}/edit-${moduleName}.service';
import { FindAll${moduleNamePascal} } from './application/usecases/find-all-${moduleName}/find-all-${moduleName}.service';
import { Find${moduleNamePascal}ById } from './application/usecases/find-${moduleName}-by-id/find-${moduleName}-by-id.service';
import { ${moduleNamePascal}Controller } from './infra/http/${moduleName}.controller';
import { ${moduleNamePascal}Dao } from './infra/persistence/${moduleName}.dao';

@Module({
  controllers: [
    ${moduleNamePascal}Controller,
  ],
  providers: [
    ${moduleNamePascal}Dao,
    Create${moduleNamePascal},
    FindAll${moduleNamePascal},
    Find${moduleNamePascal}ById,
    Edit${moduleNamePascal},
    Delete${moduleNamePascal},
  ],
})
export class ${moduleNamePascal}Module {}
`;
}
