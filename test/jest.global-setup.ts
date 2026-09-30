import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Environment } from '../src/core/config/environment.enum';

const TEST_DATABASE_SUFFIX = '_test';

// Specs de integração fazem deleteMany: aborta o Jest se o banco de teste não for dedicado.
export default function globalSetup(): void {
  if (process.env.NODE_ENV !== Environment.Test) {
    return;
  }

  const databaseName = getDatabaseName(process.env.DATABASE_URL ?? readEnvFileValue('DATABASE_URL'));
  if (!databaseName.endsWith(TEST_DATABASE_SUFFIX)) {
    throw new Error(
      `DATABASE_URL de teste precisa apontar para um banco terminado em "${TEST_DATABASE_SUFFIX}" `
      + `(atual: "${databaseName || 'vazio'}"). Ajuste o .env.${Environment.Test} antes de rodar os testes.`,
    );
  }
}

function readEnvFileValue(key: string): string | undefined {
  const file = join(__dirname, '..', `.env.${Environment.Test}`);
  if (!existsSync(file)) {
    return undefined;
  }

  const line = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${key}=`));

  return line?.slice(key.length + 1).trim().replace(/^['"]|['"]$/g, '');
}

function getDatabaseName(databaseUrl?: string): string {
  if (!databaseUrl) {
    return '';
  }

  try {
    return new URL(databaseUrl).pathname.replace(/^\//, '');
  }
  catch {
    return '';
  }
}
