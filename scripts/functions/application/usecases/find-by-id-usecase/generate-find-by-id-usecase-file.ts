import { Props } from 'scripts/generate-module';

export function generateFindByIdUsecaseFile({ moduleName, moduleNameCamel, moduleNamePascal }: Props) {
  return `import { Injectable, NotFoundException } from '@nestjs/common';
import { ${moduleNamePascal}Dao } from 'src/modules/${moduleName}/infra/persistence/${moduleName}.dao';
import { Errors } from 'src/shared/errors/message';
import { ${moduleNamePascal}Dto } from '../../dtos/${moduleName}.dto';

@Injectable()
export class Find${moduleNamePascal}ById {
  constructor(private ${moduleNameCamel}Dao: ${moduleNamePascal}Dao) {}

  public async execute(id: string): Promise<${moduleNamePascal}Dto> {
    const ${moduleNameCamel} = await this.${moduleNameCamel}Dao.findById(id);

    if (!${moduleNameCamel}) {
      throw new NotFoundException(Errors.${moduleNamePascal.toUpperCase()}_NOT_FOUND);
    }
    return ${moduleNameCamel};
  }
}
`;
}
