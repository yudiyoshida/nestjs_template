import * as fs from 'fs/promises';
import * as path from 'path';
import { convertToPascalCase } from './utils/convert-pascalcase';

// Execução.
const args = process.argv.slice(2, 4);
if (args.length !== 2) {
  console.error('Erro. Uso correto: npx ts-node scripts/generate-use-case.ts <nome-do-modulo> <nome-do-use-case>');
  process.exit(1);
}

main(args[0], args[1]);
// --

async function main(moduleName: string, useCaseName: string) {
  const modulePath = path.join(__dirname, '..', 'src', 'modules', moduleName);
  const useCasesPath = path.join(modulePath, 'use-cases', useCaseName);
  const useCasesDtoPath = path.join(modulePath, 'use-cases', useCaseName, 'dtos');

  // Tenta acessar a pasta do módulo para ver se existe.
  try {
    await fs.access(modulePath);
  }
  catch (err) {
    return console.error(`Erro! O módulo "${moduleName}" não existe. Crie-o primeiro e depois tente novamente.`);
  }

  // Tenta acessar a pasta do use-case para ver se existe.
  try {
    await fs.access(useCasesPath);
    return console.error(`Erro! O use case "${useCaseName}" já existe.`);
  }
  catch (err) {
    // O use-case não existe, então segue o fluxo.
  }

  // Cria a pasta do use-case.
  await fs.mkdir(useCasesPath);

  // Cria a pasta dtos em use-case.
  await fs.mkdir(useCasesDtoPath);

  // Cria o arquivo dto e teste.
  await fs.writeFile(
    path.join(useCasesDtoPath, `${useCaseName}.dto.ts`),
    generateDtoContent(useCaseName, moduleName),
  );
  await fs.writeFile(
    path.join(useCasesDtoPath, `${useCaseName}.dto.spec.ts`),
    generateDtoSpecContent(useCaseName),
  );

  // Cria o arquivo controller e teste.
  await fs.writeFile(
    path.join(useCasesPath, `${useCaseName}.controller.ts`),
    generateControllerContent(useCaseName),
  );
  await fs.writeFile(
    path.join(useCasesPath, `${useCaseName}.controller.spec.ts`),
    generateControllerSpecContent(useCaseName),
  );

  // Cria o arquivo service e teste.
  await fs.writeFile(
    path.join(useCasesPath, `${useCaseName}.service.ts`),
    generateServiceContent(moduleName, useCaseName),
  );
  await fs.writeFile(
    path.join(useCasesPath, `${useCaseName}.service.spec.ts`),
    generateServiceSpecContent(moduleName, useCaseName),
  );

  console.log(`Use case "${useCaseName}" criado com sucesso.`);
}

function generateDtoContent(useCase: string, moduleName: string) {
  return `import { ${convertToPascalCase(moduleName)} } from '../../../entities/${moduleName}.entity';

export class ${convertToPascalCase(useCase)}InputDto implements ${convertToPascalCase(moduleName)} {}

export class ${convertToPascalCase(useCase)}OutputDto implements ${convertToPascalCase(moduleName)} {}
`;
}

function generateDtoSpecContent(useCase: string) {
  return `import { dtoValidator } from 'src/shared/validators/dto-validator';
import { ${convertToPascalCase(useCase)}InputDto } from './${useCase}.dto';

describe('${convertToPascalCase(useCase)}InputDto', () => {
  it('should test every field in dto', async() => {
    // Arrange
    const data = {};

    // Act
    const result = await dtoValidator(${convertToPascalCase(useCase)}InputDto, data);

    // Assert
    expect(result).toBeInstanceOf(${convertToPascalCase(useCase)}InputDto);
  });
});
`;
}

function generateControllerContent(useCase: string) {
  const pascalUseCase = convertToPascalCase(useCase);

  return `import { Controller, Get } from '@nestjs/common';
import { ${pascalUseCase}Service } from './${useCase}.service';
import { ${pascalUseCase}OutputDto } from './dtos/${useCase}.dto';

@Controller()
export class ${pascalUseCase}Controller {
  constructor(private service: ${pascalUseCase}Service) {}

  @Get()
  public async handle(): Promise<${pascalUseCase}OutputDto> {
    return this.service.execute();
  }
}
`;
}

function generateControllerSpecContent(useCase: string) {
  const pascalUseCase = convertToPascalCase(useCase);

  return `import { TestBed } from '@automock/jest';
import { ${pascalUseCase}Controller } from './${useCase}.controller';
import { ${pascalUseCase}Service } from './${useCase}.service';

describe('${pascalUseCase}Controller', () => {
  let sut: ${pascalUseCase}Controller;
  let mockService: jest.Mocked<${pascalUseCase}Service>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(${pascalUseCase}Controller).compile();

    sut = unit;
    mockService = unitRef.get(${pascalUseCase}Service);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
    expect(mockService).toBeDefined();
  });
});
`;
}

function generateServiceContent(module: string, useCase: string) {
  const pascalUseCase = convertToPascalCase(useCase);
  const pascalModule = convertToPascalCase(module);

  return `import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/shared/ioc/tokens';
import { I${pascalModule}Repository } from '../../repositories/${module}-repository.interface';

@Injectable()
export class ${pascalUseCase}Service {
  constructor(
    @Inject(TOKENS.I${pascalModule}Repository) private repository: I${pascalModule}Repository
  ) {}

  public async execute() {}
}
`;
}

function generateServiceSpecContent(module: string, useCase: string) {
  return `import { TestBed } from '@automock/jest';
import { TOKENS } from 'src/shared/ioc/tokens';
import { ${convertToPascalCase(module)}InMemoryAdapterRepository } from '../../repositories/adapters/${module}-in-memory.repository';
import { ${convertToPascalCase(useCase)}Service } from './${useCase}.service';

describe('${convertToPascalCase(useCase)}Service', () => {
  let sut: ${convertToPascalCase(useCase)}Service;
  let mockRepository: jest.Mocked<${convertToPascalCase(module)}InMemoryAdapterRepository>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(${convertToPascalCase(useCase)}Service).compile();

    sut = unit;
    mockRepository = unitRef.get(TOKENS.I${convertToPascalCase(module)}Repository);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
    expect(mockRepository).toBeDefined();
  });
});
`;
}
