import { Props } from 'scripts/generate-module';

export function generateFindAllUsecaseFile({ moduleName, moduleNameCamel, moduleNamePascal }: Props) {
  return `import { Injectable } from '@nestjs/common';
import { ${moduleNamePascal}Dao } from 'src/modules/${moduleName}/infra/persistence/${moduleName}.dao';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination';
import { ${moduleNamePascal}Dto } from '../../dtos/${moduleName}.dto';
import { FindAll${moduleNamePascal}QueryDto } from './dtos/find-all-${moduleName}.dto';

@Injectable()
export class FindAll${moduleNamePascal} {
  constructor(private ${moduleNameCamel}Dao: ${moduleNamePascal}Dao) {}

  public async execute(queries: FindAll${moduleNamePascal}QueryDto): Promise<IPagination<${moduleNamePascal}Dto>> {
    const [result, total] = await this.${moduleNameCamel}Dao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getResult();
  }
}
`;
}
