export interface IHashingService {
  compare(text: string, hashText: string): boolean;
  hash(text: string, saltOrRounds?: string | number): string;
}
