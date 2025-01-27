import { Props } from 'scripts/generate-module';

export function generateEditUsecaseFile({ moduleName, moduleNameCamel, moduleNamePascal }: Props) {
  return `import { Injectable, NotFoundException } from '@nestjs/common';
import { SuccessMessage } from 'src/infra/openapi/success-message';
import { ${moduleNamePascal}Dao } from 'src/modules/${moduleName}/infra/persistence/${moduleName}.dao';
import { Errors } from 'src/shared/errors/message';
import { Edit${moduleNamePascal}InputDto } from './dtos/edit-${moduleName}.dto';

@Injectable()
export class Edit${moduleNamePascal} {
  constructor(private ${moduleNameCamel}Dao: ${moduleNamePascal}Dao) {}

  public async execute(id: string, data: Edit${moduleNamePascal}InputDto): Promise<SuccessMessage> {
    const ${moduleNameCamel} = await this.${moduleNameCamel}Dao.findById(id);
    if (!${moduleNameCamel}) {
      throw new NotFoundException(Errors.${moduleNamePascal.toUpperCase()}_NOT_FOUND);
    }

    await this.${moduleNameCamel}Dao.edit(${moduleNameCamel}.id, data);

    return { message: 'Edição realizada com sucesso' };
  }
}
`;
}
