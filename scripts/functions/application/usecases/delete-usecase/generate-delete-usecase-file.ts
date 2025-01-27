import { Props } from 'scripts/generate-module';

export function generateDeleteUsecaseFile({ moduleName, moduleNameCamel, moduleNamePascal }: Props) {
  return `import { Injectable, NotFoundException } from '@nestjs/common';
import { SuccessMessage } from 'src/infra/openapi/success-message';
import { ${moduleNamePascal}Dao } from 'src/modules/${moduleName}/infra/persistence/${moduleName}.dao';
import { Errors } from 'src/shared/errors/message';

@Injectable()
export class Delete${moduleNamePascal} {
  constructor(private ${moduleNameCamel}Dao: ${moduleNamePascal}Dao) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const ${moduleNameCamel} = await this.${moduleNameCamel}Dao.findById(id);
    if (!${moduleNameCamel}) {
      throw new NotFoundException(Errors.${moduleNamePascal.toUpperCase()}_NOT_FOUND);
    }

    await this.${moduleNameCamel}Dao.delete(${moduleNameCamel}.id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
`;
}
