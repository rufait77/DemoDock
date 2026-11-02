export interface DemoRole { id: string; label: string; description?: string }
export interface DemoScenario<T> { id: string; label: string; description?: string; seed: () => T }
export interface TourStep { target: string; title: string; description: string }
export interface DemoStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export interface StoreOptions<T extends object> {
  id: string;
  version?: number;
  roles: DemoRole[];
  scenarios: DemoScenario<T>[];
  initialRole?: string;
  initialScenario?: string;
  /** Defaults to sessionStorage in a browser, memory elsewhere. Use false to disable persistence. */
  storage?: DemoStorage | false;
  validateState?: (value: unknown) => value is T;
  tour?: TourStep[];
}
export interface DemoSnapshot<T> {
  data: T;
  role: string;
  scenario: string;
  revision: number;
  requests: number;
  storage: 'session' | 'custom' | 'memory';
}
export interface DemoStore<T extends object> {
  readonly options: StoreOptions<T>;
  getSnapshot(): DemoSnapshot<T>;
  subscribe(listener: () => void): () => void;
  update(recipe: (draft: T) => void | T): void;
  setRole(role: string): void;
  setScenario(scenario: string): void;
  reset(): void;
  recordRequest(): void;
  clear(): void;
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) freeze(item);
  }
  return value;
}

/** A small external store. Every mutation operates on a cloned draft. */
export function createDemoStore<T extends object>(options: StoreOptions<T>): DemoStore<T> {
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(options.id)) throw new Error('DemoDock: provide a stable, non-empty id using letters, numbers, dots, dashes or underscores.');
  for (const [name, items] of [['roles', options.roles], ['scenarios', options.scenarios]] as const) {
    if (!items.length || items.some(item => !item.id) || new Set(items.map(item => item.id)).size !== items.length) {
      throw new Error(`DemoDock: ${name} must contain unique, non-empty ids.`);
    }
  }
  const roleIds = new Set(options.roles.map(item => item.id));
  const scenarios = new Map(options.scenarios.map(item => [item.id, item]));
  const initialRole = options.initialRole ?? options.roles[0].id;
  const initialScenario = options.initialScenario ?? options.scenarios[0].id;
  if (!roleIds.has(initialRole) || !scenarios.has(initialScenario)) throw new Error('DemoDock: unknown initial role or scenario.');
  const key = `demodock:${options.id}`;
  const version = options.version ?? 1;
  let storage: DemoStorage | undefined;
  let storageKind: DemoSnapshot<T>['storage'] = 'memory';
  try {
    if (options.storage) { storage = options.storage; storageKind = 'custom'; }
    else if (options.storage !== false && typeof window !== 'undefined') { storage = window.sessionStorage; storageKind = 'session'; }
  } catch { /* Storage can be disabled by browser policy. Memory mode still works. */ }
  let role = initialRole;
  let scenario = initialScenario;
  let data = structuredClone(scenarios.get(scenario)!.seed());
  try {
    const saved = storage?.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.version === version && roleIds.has(parsed.role) && scenarios.has(parsed.scenario)
          && parsed.data && typeof parsed.data === 'object'
          && (!options.validateState || options.validateState(parsed.data))) {
        role = parsed.role; scenario = parsed.scenario; data = parsed.data;
      }
    }
  } catch { /* Malformed or outdated data is discarded, never sent anywhere. */ }
  let snapshot: DemoSnapshot<T> = { data: freeze(data), role, scenario, revision: 0, requests: 0, storage: storageKind };
  const listeners = new Set<() => void>();
  const notify = (next: Partial<DemoSnapshot<T>>, persist = true) => {
    snapshot = { ...snapshot, ...next };
    if (persist && storage) {
      try { storage.setItem(key, JSON.stringify({ version, data: snapshot.data, role: snapshot.role, scenario: snapshot.scenario })); }
      catch { storage = undefined; snapshot = { ...snapshot, storage: 'memory' }; }
    }
    listeners.forEach(listener => listener());
  };
  const seed = (id: string) => freeze(structuredClone(scenarios.get(id)!.seed()));
  return {
    options,
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    update(recipe) {
      const draft = structuredClone(snapshot.data);
      const next = recipe(draft) ?? draft;
      if (options.validateState && !options.validateState(next)) throw new Error('DemoDock: update returned invalid state.');
      notify({ data: freeze(next), revision: snapshot.revision + 1 });
    },
    setRole(id) {
      if (!roleIds.has(id)) throw new Error(`DemoDock: unknown role "${id}".`);
      notify({ role: id, revision: snapshot.revision + 1 });
    },
    setScenario(id) {
      if (!scenarios.has(id)) throw new Error(`DemoDock: unknown scenario "${id}".`);
      notify({ scenario: id, data: seed(id), revision: snapshot.revision + 1, requests: 0 });
    },
    reset() { notify({ data: seed(snapshot.scenario), revision: snapshot.revision + 1, requests: 0 }); },
    recordRequest() { notify({ requests: snapshot.requests + 1 }, false); },
    clear() {
      try { storage?.removeItem(key); } catch { /* Best effort on restricted storage. */ }
      notify({ data: seed(initialScenario), role: initialRole, scenario: initialScenario, revision: snapshot.revision + 1, requests: 0 }, false);
    }
  };
}
