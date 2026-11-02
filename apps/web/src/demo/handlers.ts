import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { DemoStore } from '@rufait77/demodock';
import { stages, stageLabels, type Workspace, type Deal, type Contact } from './data';

const fail = (message: string, status: number) => HttpResponse.json({ message }, { status });
const text = (value: unknown, max = 100) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
export function workspaceHandlers(store: DemoStore<Workspace>, origin = '') {
  const writable = () => store.getSnapshot().role === 'editor';
  const log = (draft: Workspace, message: string) => { draft.activities.unshift({ id: crypto.randomUUID(), text: message, at: new Date().toISOString() }); draft.activities = draft.activities.slice(0, 50); };
  const read = async (request: Request): Promise<Record<string, unknown> | null> => {
    try { const body = await request.json(); return body && typeof body === 'object' && !Array.isArray(body) ? body : null; } catch { return null; }
  };
  return [
    http.get(`${origin}/api/workspace`, async () => { await delay(120); return HttpResponse.json(store.getSnapshot().data); }),
    http.post(`${origin}/api/deals`, async ({ request }) => {
      if (!writable()) return fail('Viewer mode is read-only. Switch to Editor to make changes.', 403);
      const body = await read(request);
      if (!body || !text(body.name) || !text(body.company) || typeof body.value !== 'number' || !Number.isFinite(body.value) || body.value < 0 || body.value > 100000000 || !stages.includes(body.stage as never)) return fail('Enter a deal name, company, valid stage and value between $0 and $100,000,000.', 400);
      const deal: Deal = { id: crypto.randomUUID(), name: (body.name as string).trim(), company: (body.company as string).trim(), value: body.value, stage: body.stage as Deal['stage'], owner: 'You' };
      store.update(draft => { draft.deals.unshift(deal); log(draft, `You added ${deal.name} for ${deal.company}`); });
      return HttpResponse.json(deal, { status: 201 });
    }),
    http.patch(`${origin}/api/deals/:id`, async ({ request, params }) => {
      if (!writable()) return fail('Viewer mode is read-only. Switch to Editor to make changes.', 403);
      if (!store.getSnapshot().data.deals.some(d => d.id === params.id)) return fail('Deal not found.', 404);
      const body = await read(request);
      if (!body || Object.keys(body).length === 0 || Object.keys(body).some(key => !['name','company','value','stage'].includes(key))) return fail('Provide supported deal fields.', 400);
      if (('name' in body && !text(body.name)) || ('company' in body && !text(body.company)) || ('value' in body && (typeof body.value !== 'number' || !Number.isFinite(body.value) || body.value < 0 || body.value > 100000000)) || ('stage' in body && !stages.includes(body.stage as never))) return fail('Invalid deal details.', 400);
      store.update(draft => {
        const deal = draft.deals.find(d => d.id === params.id)!;
        if ('name' in body) deal.name = (body.name as string).trim();
        if ('company' in body) deal.company = (body.company as string).trim();
        if ('value' in body) deal.value = body.value as number;
        if ('stage' in body) deal.stage = body.stage as Deal['stage'];
        log(draft, 'stage' in body ? `You moved ${deal.name} to ${stageLabels[deal.stage]}` : `You updated ${deal.name}`);
      });
      return HttpResponse.json(store.getSnapshot().data.deals.find(d => d.id === params.id));
    }),
    http.delete(`${origin}/api/deals/:id`, ({ params }) => {
      if (!writable()) return fail('Viewer mode is read-only.', 403);
      const deal = store.getSnapshot().data.deals.find(d => d.id === params.id);
      if (!deal) return fail('Deal not found.', 404);
      store.update(draft => { draft.deals = draft.deals.filter(d => d.id !== params.id); log(draft, `You deleted ${deal.name}`); });
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${origin}/api/contacts`, async ({ request }) => {
      if (!writable()) return fail('Viewer mode is read-only.', 403);
      const body = await read(request);
      if (!body || !text(body.name) || !text(body.company) || !text(body.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email as string) || (body.title !== undefined && typeof body.title !== 'string')) return fail('Enter a name, company and valid email address.', 400);
      if (store.getSnapshot().data.contacts.some(c => c.email.toLowerCase() === (body.email as string).trim().toLowerCase())) return fail('A contact with this email already exists.', 409);
      const contact: Contact = { id: crypto.randomUUID(), name: (body.name as string).trim(), company: (body.company as string).trim(), email: (body.email as string).trim(), title: String(body.title ?? '').trim().slice(0, 100) };
      store.update(draft => { draft.contacts.unshift(contact); log(draft, `You added ${contact.name} at ${contact.company}`); });
      return HttpResponse.json(contact, { status: 201 });
    }),
    http.delete(`${origin}/api/contacts/:id`, ({ params }) => {
      if (!writable()) return fail('Viewer mode is read-only.', 403);
      const contact = store.getSnapshot().data.contacts.find(c => c.id === params.id);
      if (!contact) return fail('Contact not found.', 404);
      store.update(draft => { draft.contacts = draft.contacts.filter(c => c.id !== params.id); log(draft, `You deleted ${contact.name}`); });
      return new HttpResponse(null, { status: 204 });
    }),
    http.all(`${origin}/api/*`, () => fail('This endpoint is not part of the demo. No backend request was made.', 404))
  ];
}
