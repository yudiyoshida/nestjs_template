import { Transform, TransformOptions } from 'class-transformer';

// TODO: testes.
export function StringToNumber(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string') ? Number(value) : value, opts);
}
