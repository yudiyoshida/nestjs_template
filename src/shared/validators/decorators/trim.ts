import { Transform, TransformOptions } from 'class-transformer';

// TODO: testes.
export function Trim(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string') ? value.trim() : value, opts);
}
