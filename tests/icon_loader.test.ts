import { IconLoader } from '../src/icon';

describe('IconLoader (stub)', () => {
  test('register and list', () => {
    const loader = new IconLoader('myplugin', import.meta.url);
    loader.register('icon1', 'icons/icon1.svg');
    loader.register('icon2', 'icons/icon2.svg');
    const list = loader.list();
    expect(list).toContain('icon1');
    expect(list).toContain('icon2');
  });

  test('load returns meta stub for registered icon', async () => {
    const loader = new IconLoader('pkg', import.meta.url);
    loader.register('a', 'icons/a.svg');
    const meta = await loader.load('a');
    expect(meta).not.toBeNull();
    expect(meta?.href).toBe('pkg-a');
    expect(typeof meta?.raw).toBe('string');
  });
});
