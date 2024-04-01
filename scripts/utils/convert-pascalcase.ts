export function convertToPascalCase(input: string): string {
  return input.replace(/(?:^|-)([a-z])/g, (_, letter) => letter.toUpperCase());
}
