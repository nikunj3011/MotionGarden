import { it, expect, vi, afterEach } from 'vitest';
import { StaticCloudflareRepository } from './index';
afterEach(() => vi.unstubAllGlobals());
it('uses cached content offline and makes conditional requests', async () => {
  vi.stubGlobal('location', { href: 'https://garden.test/' });
  const cache = new Map<string, string>();
  const storage = {
    getItem: (k: string) => cache.get(k) || null,
    setItem: (k: string, v: string) => {
      cache.set(k, v);
    },
    get length() {
      return cache.size;
    },
    clear: () => cache.clear(),
    key: (index: number) => Array.from(cache.keys())[index] ?? null,
    removeItem: (key: string) => {
      cache.delete(key);
    },
  } satisfies Storage;
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ value: 1 }), { headers: { etag: 'v1' } }))
    .mockRejectedValue(new Error('offline'));
  vi.stubGlobal('fetch', fetch);
  const repo = new StaticCloudflareRepository('/', storage);
  expect(await repo.json('catalog/v1/index.json')).toEqual({ value: 1 });
  expect(await repo.json('catalog/v1/index.json')).toEqual({ value: 1 });
  expect(fetch.mock.calls[1][1].headers).toEqual({ 'If-None-Match': 'v1' });
});
