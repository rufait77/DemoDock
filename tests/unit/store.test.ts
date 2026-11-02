import { describe, expect, it } from 'vitest';
import { createDemoStore, type DemoStorage, type StoreOptions } from '../../packages/demodock/src/store';
type State = { tasks: { title: string }[] };
const config = (): StoreOptions<State> => ({ id: 'test', roles: [{ id: 'editor', label: 'Editor' }, { id: 'viewer', label: 'Viewer' }], scenarios: [{ id: 'default', label: 'Default', seed: () => ({ tasks: [{ title: 'Seed' }] }) }, { id: 'empty', label: 'Empty', seed: () => ({ tasks: [] }) }], storage: false });
function memoryStorage(): DemoStorage { const map = new Map<string, string>(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => { map.set(key, value); }, removeItem: key => { map.delete(key); } }; }
describe('demo state lifecycle', () => {
  it('isolates changes from the seed and other visitors', () => {
    const options = config(); const a = createDemoStore(options); const b = createDemoStore(options);
    a.update(state => { state.tasks[0].title = 'Changed'; });
    expect(a.getSnapshot().data.tasks[0].title).toBe('Changed');
    expect(b.getSnapshot().data.tasks[0].title).toBe('Seed');
    expect(options.scenarios[0].seed().tasks[0].title).toBe('Seed');
    expect(Object.isFrozen(a.getSnapshot().data.tasks)).toBe(true);
  });
  it('resets selected scenario and retains role', () => {
    const store = createDemoStore(config()); store.setScenario('empty'); store.setRole('viewer'); store.update(d => { d.tasks.push({ title: 'Temporary' }); }); store.reset();
    expect(store.getSnapshot()).toMatchObject({ data: { tasks: [] }, scenario: 'empty', role: 'viewer', requests: 0 });
  });
  it('persists state and discards incompatible versions', () => {
    const storage = memoryStorage(); const options = { ...config(), storage };
    const a = createDemoStore(options); a.update(d => { d.tasks.push({ title: 'Saved' }); }); a.setRole('viewer');
    expect(createDemoStore(options).getSnapshot()).toMatchObject({ role: 'viewer', data: { tasks: [{ title: 'Seed' }, { title: 'Saved' }] } });
    expect(createDemoStore({ ...options, version: 2 }).getSnapshot().data.tasks).toHaveLength(1);
  });
  it('recovers from corrupt storage and validates restored data', () => {
    const storage = memoryStorage(); storage.setItem('demodock:test', '{bad json');
    expect(createDemoStore({ ...config(), storage }).getSnapshot().data.tasks).toHaveLength(1);
    storage.setItem('demodock:test', JSON.stringify({ version: 1, role: 'editor', scenario: 'default', data: { unexpected: true } }));
    const store = createDemoStore({ ...config(), storage, validateState: (x): x is State => !!x && typeof x === 'object' && Array.isArray((x as State).tasks) });
    expect(store.getSnapshot().data.tasks).toHaveLength(1);
  });
  it('continues in memory when storage is denied', () => {
    const storage = { getItem() { throw new Error('Denied'); }, setItem() { throw new Error('Quota'); }, removeItem() { throw new Error('Denied'); } };
    const store = createDemoStore({ ...config(), storage }); store.update(d => { d.tasks = []; });
    expect(store.getSnapshot()).toMatchObject({ data: { tasks: [] }, storage: 'memory' }); expect(() => store.clear()).not.toThrow();
  });
  it('rejects unknown selections, duplicate identifiers, and invalid updates', () => {
    const store = createDemoStore(config()); expect(() => store.setRole('owner')).toThrow('unknown role'); expect(() => store.setScenario('missing')).toThrow('unknown scenario');
    expect(() => createDemoStore({ ...config(), roles: [{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }] })).toThrow('unique');
    const validated = createDemoStore({ ...config(), validateState: (x): x is State => Array.isArray((x as State).tasks) });
    expect(() => validated.update(d => { (d as unknown as { tasks: null }).tasks = null; })).toThrow('invalid state');
    expect(validated.getSnapshot().data.tasks).toHaveLength(1);
  });
  it('keeps snapshots stable and notifies subscribers only on changes', () => {
    const store = createDemoStore(config()); const first = store.getSnapshot(); let calls = 0; const off = store.subscribe(() => calls++);
    expect(store.getSnapshot()).toBe(first); store.recordRequest(); expect(calls).toBe(1); expect(store.getSnapshot().revision).toBe(0);
    off(); store.reset(); expect(calls).toBe(1);
  });
});
