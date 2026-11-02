import { createRoot } from 'react-dom/client';
import { useEffect, useState, type FormEvent } from 'react';
import { DemoDock, useDemo } from '@rufait77/demodock/react';
import '@rufait77/demodock/styles.css';
import './style.css';
import { demo, type State } from './demo';

function App() {
  const snapshot = useDemo(demo);
  const [tasks, setTasks] = useState<State['tasks']>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const writable = snapshot.role === 'editor';
  useEffect(() => {
    let active = true;
    fetch('/api/tasks').then(r => { if (!r.ok) throw new Error('Could not load the demo.'); return r.json(); }).then(data => { if (active) setTasks(data); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [snapshot.revision]);
  const request = async (path: string, method: string, body?: unknown) => {
    setError(''); setBusy(true);
    try {
      const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      if (!response.ok) throw new Error((await response.json()).message);
      if (method === 'POST') setTitle('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save.'); }
    finally { setBusy(false); }
  };
  const add = (e: FormEvent) => { e.preventDefault(); void request('/api/tasks', 'POST', { title }); };
  return <><main><a className="brand" href="https://demodock.rufaitlabs.cloud">d.</a><span className="eyebrow">YOUR FIRST DEMODOCK PLAYGROUND</span><h1>A little space<br/>to try things.</h1><p>Create a task, check it off, and start again. This entire workspace runs in your browser.</p><section className="tasks"><div className="tasks-header"><h2>Your little list</h2><span>{tasks.filter(t => t.done).length} / {tasks.length} done</span></div>{tasks.map(task => <label key={task.id} className={task.done ? 'done' : ''}><input type="checkbox" checked={task.done} disabled={!writable || busy} onChange={() => void request(`/api/tasks/${task.id}`, 'PATCH')}/><span>{task.title}</span></label>)}{!tasks.length && <p className="empty">A fresh canvas. What will you add?</p>}<form onSubmit={add}><input id="new-task" aria-label="New task" value={title} onChange={e => setTitle(e.target.value)} placeholder={writable ? 'Something worth trying…' : 'Viewer mode is read-only'} maxLength={120} required disabled={!writable || busy}/><button disabled={!writable || busy}>{busy ? 'Saving…' : 'Add task'}</button></form>{error && <p className="error" role="alert">{error}</p>}</section><small className="caption">Fictional data. Real interactions. Yours to build on.</small></main><DemoDock demo={demo}/></>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<main><p>Preparing your playground…</p></main>);
demo.start().then(() => root.render(<App/>)).catch(() => root.render(<main><h1>The demo couldn’t start.</h1><p>Use HTTPS or localhost and a browser with service workers enabled. The app has not made any backend requests.</p></main>));
