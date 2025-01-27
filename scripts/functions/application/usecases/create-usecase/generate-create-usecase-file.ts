import { Props } from 'scripts/generate-module';

export function generateCreateUsecaseFile({ moduleName, moduleNameCamel, moduleNamePascal }: Props) {
  return `import { Injectable } from '@nestjs/common';
import { ${moduleNamePascal}Dao } from 'src/modules/${moduleName}/infra/persistence/${moduleName}.dao';
import { Create${moduleNamePascal}InputDto, Create${moduleNamePascal}OutputDto } from './dtos/create-${moduleName}.dto';

@Injectable()
export class Create${moduleNamePascal} {
  constructor(private ${moduleNameCamel}Dao: ${moduleNamePascal}Dao) {}

  public async execute(data: Create${moduleNamePascal}InputDto): Promise<Create${moduleNamePascal}OutputDto> {
    const result = await this.${moduleNameCamel}Dao.save(data);

    return { id: result.id };
  }
}
`;
}
