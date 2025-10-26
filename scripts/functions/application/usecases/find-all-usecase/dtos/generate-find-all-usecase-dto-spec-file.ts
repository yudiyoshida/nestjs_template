import { Props } from 'scripts/generate-module';

export function generateFindAllUsecaseDtoSpecFile({ moduleName, moduleNamePascal }: Props) {
  return `// import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
// import { pipeOptions } from 'src/infra/validators/class-*/config';
// import { FindAll${moduleNamePascal}QueryDto } from './find-all-${moduleName}.dto';
// 
// const metadata: ArgumentMetadata = {
//   type: 'body',
//   metatype: FindAll${moduleNamePascal}QueryDto,
// };
// 
// describe('FindAll${moduleNamePascal}QueryDto', () => {
//   let target: ValidationPipe;
// 
//   beforeEach(() => {
//     target = new ValidationPipe(pipeOptions);
//   });
// 
//   describe.each(
//     [
//       'field',
//     ]
//   )('%s field', (field: string) => {
//     it.each(
//       [
//         undefined,
//         null,
//         '',
//         '  ',
//       ]
//     )(\`should throw an error if \${field} is empty (%s)\`, async(value: any) => {
//       const data = { [field]: value };
// 
//       expect.assertions(1);
//       return target.transform(data, metadata).catch((error) => {
//         expect(error.getResponse().message).toContain(\`\${field} é obrigatório\`);
//       });
//     });
// 
//     it.each(
//       [
//         123,
//         true,
//         false,
//         {},
//         [],
//       ]
//     )('should throw an error if %s is not a string (%s)', async(value: any) => {
//       const data = { [field]: value };
// 
//       expect.assertions(1);
//       return target.transform(data, metadata).catch((error) => {
//         expect(error.getResponse().message).toContain(\`\${field} deve ser uma string\`);
//       });
//     });
//   });
// 
//   it('should pass if all fields are valid', async() => {
//     const data = {
//       field: 'name',
//     };
// 
//     const result = await target.transform(data, metadata);
// 
//     expect(result).toBeInstanceOf(FindAll${moduleNamePascal}QueryDto);
//     expect(result).toEqual(data);
//   });
// });
`;
}
