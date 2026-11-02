import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { createDemoStore } from '../../packages/demodock/src/store';
import { workspaceHandlers } from '../../apps/web/src/demo/handlers';
import { seedWorkspace, isWorkspace } from '../../apps/web/src/demo/data';
const store = createDemoStore({ id: 'api-test', storage: false, roles: [{ id: 'editor', label: 'Editor' }, { id: 'viewer', label: 'Viewer' }], scenarios: [{ id: 'normal', label: 'Normal', seed: seedWorkspace }], validateState: isWorkspace });
const server = setupServer(...workspaceHandlers(store, 'http://localhost'));
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => { store.clear(); });
afterAll(() => server.close());
const request = (path: string, method: string, body?: unknown) => fetch(`http://localhost/api/${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
describe('Folio HTTP contract', () => {
  it('creates, updates and deletes a deal with persistent side effects', async () => {
    const created = await request('deals', 'POST', { name: 'New', company: 'Example', value: 1250, stage: 'lead' }); expect(created.status).toBe(201);
    const deal = await created.json(); expect(store.getSnapshot().data.deals).toHaveLength(9);
    const updated = await request(`deals/${deal.id}`, 'PATCH', { stage: 'won' }); expect(updated.status).toBe(200); expect((await updated.json()).stage).toBe('won');
    expect((await request(`deals/${deal.id}`, 'DELETE')).status).toBe(204); expect(store.getSnapshot().data.deals).toHaveLength(8);
    expect(store.getSnapshot().data.activities[0].text).toContain('deleted');
  });
  it('enforces viewer role at API level', async () => {
    store.setRole('viewer');
    for (const [path, method, body] of [['deals', 'POST', {}], ['deals/d1', 'PATCH', { value: 0 }], ['deals/d1', 'DELETE', undefined], ['contacts', 'POST', {}], ['contacts/c1', 'DELETE', undefined]] as const) expect((await request(path, method, body)).status).toBe(403);
    expect(store.getSnapshot().data).toEqual(seedWorkspace());
  });
  it('rejects malformed data and unknown IDs without mutation', async () => {
    expect((await request('deals', 'POST', { name: ' ', company: 'X', value: -2, stage: 'lead' })).status).toBe(400);
    expect((await request('deals/d1', 'PATCH', { stage: 'invalid' })).status).toBe(400);
    expect((await request('deals/d1', 'PATCH', { owner: 'Override' })).status).toBe(400);
    expect((await request('deals/unknown', 'DELETE')).status).toBe(404);
    expect((await request('unknown', 'GET')).status).toBe(404);
    expect(store.getSnapshot().data).toEqual(seedWorkspace());
  });
  it('validates contacts and prevents duplicate emails', async () => {
    const contact = { name: 'Test Person', company: 'Example', email: 'person@example.test', title: 'Founder' };
    expect((await request('contacts', 'POST', contact)).status).toBe(201);
    expect((await request('contacts', 'POST', { ...contact, email: 'PERSON@example.test' })).status).toBe(409);
    expect((await request('contacts', 'POST', { ...contact, email: 'invalid' })).status).toBe(400);
  });
});
