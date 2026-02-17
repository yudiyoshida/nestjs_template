import * as path from 'path';
import type { Props } from '../config';
import { writeGeneratedFile } from '../utils/fs';

export async function generateDomain(props: Props): Promise<void> {
  const domainPath = path.join(props.modulePath, 'domain');
  const gitkeepPath = path.join(domainPath, '.gitkeep');
  await writeGeneratedFile(gitkeepPath, '');
}
