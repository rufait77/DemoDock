import { createDemo } from '@rufait77/demodock';
import { http, HttpResponse } from 'msw/http';
export interface State { tasks: { id: string; title: string; done: boolean }[] }
const initial = (): State => ({ tasks: [{ id: 't1', title: 'Make yourself at home', done: false }, { id: 't2', title: 'Try switching roles', done: false }, { id: 't3', title: 'Reset and explore again', done: true }] });
export const demo = createDemo<State>({
  id: 'my-playground', version: 1,
  roles: [{ id: 'editor', label: 'Editor' }, { id: 'viewer', label: 'Viewer' }],
  scenarios: [{ id: 'welcome', label: 'A little inspiration', seed: initial }, { id: 'empty', label: 'A blank canvas', seed: () => ({ tasks: [] }) }],
  validateState: (value): value is State => !!value && typeof value === 'object' && Array.isArray((value as State).tasks) && (value as State).tasks.every(task => typeof task.id === 'string' && typeof task.title === 'string' && typeof task.done === 'boolean'),
  handlers: store => [
    http.get('/api/tasks', () => HttpResponse.json(store.getSnapshot().data.tasks)),
    http.post('/api/tasks', async ({ request }) => {
      if (store.getSnapshot().role !== 'editor') return HttpResponse.json({ message: 'This role is read-only.' }, { status: 403 });
      let body: unknown;
      try { body = await request.json(); } catch { return HttpResponse.json({ message: 'Invalid JSON.' }, { status: 400 }); }
      const title = body && typeof body === 'object' && 'title' in body ? body.title : undefined;
      if (typeof title !== 'string' || !title.trim() || title.length > 120) return HttpResponse.json({ message: 'Use a task title between 1 and 120 characters.' }, { status: 400 });
      const task = { id: crypto.randomUUID(), title: title.trim(), done: false };
      store.update(draft => { draft.tasks.push(task); });
      return HttpResponse.json(task, { status: 201 });
    }),
    http.patch('/api/tasks/:id', ({ params }) => {
      if (store.getSnapshot().role !== 'editor') return HttpResponse.json({ message: 'This role is read-only.' }, { status: 403 });
      if (!store.getSnapshot().data.tasks.some(t => t.id === params.id)) return HttpResponse.json({ message: 'Task not found.' }, { status: 404 });
      store.update(draft => { const task = draft.tasks.find(t => t.id === params.id)!; task.done = !task.done; });
      return HttpResponse.json({ ok: true });
    })
  ],
  tour: [{ target: '#new-task', title: 'Make a change', description: 'Add a fictional task. Your edits stay in this browser tab. Use the dock to reset, change scenarios, or try a read-only role.' }]
});
