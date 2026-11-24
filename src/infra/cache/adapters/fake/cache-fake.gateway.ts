import { Injectable } from '@nestjs/common';
import { ICacheGateway } from '../../cache.gateway';

type CacheEntry = {
  value: unknown;
  expiresAt: number | null;
};

@Injectable()
export class CacheFakeAdapterGateway implements ICacheGateway {
  private readonly store = new Map<string, CacheEntry>();

  public async set<T>(key: string, value: T, ttlInSeconds?: number, _skipLog?: boolean): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlInSeconds && ttlInSeconds > 0 ? Date.now() + ttlInSeconds * 1000 : null,
    });
  }

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  public async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  public async deleteContaining(key: string): Promise<void> {
    const pattern = this.toRedisMatch(`*${key}*`);

    for (const storedKey of this.store.keys()) {
      if (pattern.test(storedKey)) {
        this.store.delete(storedKey);
      }
    }
  }

  // Mesmo padrão do MATCH do SCAN do Redis: `*` casa qualquer sequência, `?` casa um caractere e `\` escapa o próximo.
  // Classe `[...]` do Redis não entra.
  private toRedisMatch(glob: string): RegExp {
    let source = '';

    for (let index = 0; index < glob.length; index++) {
      const char = glob[index];

      if (char === '*') {
        source += '.*';
      }
      else if (char === '?') {
        source += '.';
      }
      else if (char === '\\' && index + 1 < glob.length) {
        index++;
        source += this.escapeRegExp(glob[index]);
      }
      else {
        source += this.escapeRegExp(char);
      }
    }

    return new RegExp(`^${source}$`, 's');
  }

  private escapeRegExp(char: string): string {
    return char.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  }
}
