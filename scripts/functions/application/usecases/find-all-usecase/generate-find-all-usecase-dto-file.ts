import { Props } from 'scripts/generate-module';

export function generateFindAllUsecaseDtoFile({ moduleNamePascal }: Props) {
  return `import { Queries } from 'src/infra/validators/dtos/queries.dto';

export class FindAll${moduleNamePascal}QueryDto extends Queries {}
`;
}
