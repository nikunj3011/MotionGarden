import { it, expect } from 'vitest';
import { Runtime } from './index';
it('disposal is idempotent and controls tolerate an uninitialized renderer', async () => {
  const runtime = new Runtime();
  runtime.pause();
  runtime.resume();
  runtime.resize(200, 100);
  runtime.setParameters({ speed: 2 });
  runtime.dispose();
  runtime.dispose();
  await expect(runtime.capture()).rejects.toThrow('not ready');
});
