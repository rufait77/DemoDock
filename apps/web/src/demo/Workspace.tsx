import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, BookOpen, Check, ChevronDown, CircleHelp, Download, ExternalLink, LayoutGrid, Leaf, List, Menu, Plus, Search, ShieldCheck, Trash2, Users, X, Activity as ActivityIcon } from 'lucide-react';
import { DemoDock, useDemo } from '@rufait77/demodock/react';
import '@rufait77/demodock/styles.css';
import { demo } from './runtime';
import { stages, stageLabels, type Workspace as WorkspaceData, type Deal, type Contact } from './data';
import { Modal } from '../components/Modal';
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const initials = (name: string) => name.split(' ').map(p => p[0]).slice(0, 2).join('');
type Tab = 'pipeline' | 'contacts' | 'activity';
type Dialog = { type: 'deal'; deal?: Deal } | { type: 'contact' } | { type: 'delete'; item: Deal | Contact; collection: 'deals' | 'contacts' };

async function api(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(`/api/${path}`, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  if (!response.ok) { const error = await response.json(); throw new Error(error.message ?? 'Something went wrong. Please try again.'); }
  return response.status === 204 ? undefined : response.json();
}

export default function Workspace() {
  const snapshot = useDemo(demo);
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [tab, setTab] = useState<Tab>('pipeline');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [menu, setMenu] = useState(false);
  const canEdit = snapshot.role === 'editor';
  useEffect(() => {
    let current = true;
    api('workspace').then(result => { if (current) { setData(result); setError(''); } }).catch(e => { if (current) setError(e.message); });
    return () => { current = false; };
  }, [snapshot.revision]);
  useEffect(() => { setDialog(null); }, [snapshot.role, snapshot.scenario]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 3500); return () => clearTimeout(id); }, [toast]);
  const navigate = (next: Tab) => { setTab(next); setQuery(''); setMenu(false); };
  const mutate = async (path: string, method: string, body?: unknown, message?: string) => {
    setBusy(true); setError('');
    try { await api(path, method, body); setDialog(null); if (message) setToast(message); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to save.'); }
    finally { setBusy(false); }
  };
  const saveDeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const fields = new FormData(event.currentTarget);
    const body = { name: fields.get('name'), company: fields.get('company'), value: Number(fields.get('value')), stage: fields.get('stage') };
    const deal = dialog?.type === 'deal' ? dialog.deal : undefined;
    void mutate(deal?.id ? `deals/${deal.id}` : 'deals', deal?.id ? 'PATCH' : 'POST', body, deal?.id ? 'Deal updated' : 'Deal added to your pipeline');
  };
  const saveContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); void mutate('contacts', 'POST', Object.fromEntries(new FormData(event.currentTarget)), 'Contact added');
  };
  const exportData = () => {
    if (!data) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'folio-demo-workspace.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast('Your fictional workspace has been exported');
  };
  const filtered = (data?.deals ?? []).filter(d => `${d.name} ${d.company} ${d.owner}`.toLowerCase().includes(query.toLowerCase()));
  const contacts = (data?.contacts ?? []).filter(c => `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(query.toLowerCase()));
  const openDeals = data?.deals.filter(d => d.stage !== 'won') ?? [];
  const wonDeals = data?.deals.filter(d => d.stage === 'won') ?? [];
  const total = openDeals.reduce((sum, d) => sum + d.value, 0);
  const won = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const moveDeal = (deal: Deal) => { const stage = stages[stages.indexOf(deal.stage) + 1]; if (stage) void mutate(`deals/${deal.id}`, 'PATCH', { stage }, `Moved to ${stageLabels[stage]}`); };
  return <div className="workspace">
    <div className="demo-ribbon"><a href="/"><ArrowLeft size={13}/> Back to DemoDock</a><span><span className="live-dot"/> A real demo. A fictional business. All in your browser.</span><a href="/docs">Build your own <ArrowUpRight size={13}/></a></div>
    <div className="workspace-shell">
      <aside className={`workspace-sidebar ${menu ? 'sidebar-open' : ''}`}>
        <a className="folio-logo" href="/demo"><span><Leaf size={21}/></span>folio<span className="folio-period">.</span></a>
        <div className="team-selector"><span className="team-avatar">S</span><span><strong>Studio workspace</strong><small>Demo organization</small></span><ChevronDown size={14}/></div>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav aria-label="CRM navigation">
          <button className={tab === 'pipeline' ? 'selected' : ''} onClick={() => navigate('pipeline')}><LayoutGrid size={17}/>Pipeline<span className="nav-count">{data?.deals.length ?? '—'}</span></button>
          <button className={tab === 'contacts' ? 'selected' : ''} onClick={() => navigate('contacts')}><Users size={17}/>Contacts<span className="nav-count">{data?.contacts.length ?? '—'}</span></button>
          <button className={tab === 'activity' ? 'selected' : ''} onClick={() => navigate('activity')}><ActivityIcon size={17}/>Activity</button>
        </nav>
        <div className="sidebar-bottom"><div className="sandbox-note"><ShieldCheck size={20}/><strong>Yours to explore</strong><p>Everything here is sample data. Make changes. Start over. Make yourself at home.</p></div><a href="/docs"><BookOpen size={16}/>How this demo works<ExternalLink size={12}/></a><div className="user-card"><span className="avatar you">YN</span><span><strong>Your workspace</strong><small>{canEdit ? 'Editor access' : 'Read-only access'}</small></span><span className="live-dot"/></div></div>
      </aside>
      <main className="workspace-main">
        <header className="workspace-header"><div><button className="icon-button mobile-menu" aria-label="Toggle navigation" onClick={() => setMenu(!menu)}>{menu ? <X size={20}/> : <Menu size={20}/>}</button><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{tab === 'pipeline' ? 'Pipeline' : tab === 'contacts' ? 'Contacts' : 'Activity'}</strong></div><a className="help-link" href="/docs"><CircleHelp size={16}/><span>Demo guide</span></a></header>
        <div className="workspace-content">
          <div className="page-heading"><div><div className="eyebrow">YOUR STUDIO, IN MOTION</div><h1>{tab === 'pipeline' ? 'Good things in the pipeline.' : tab === 'contacts' ? 'People behind the projects.' : 'A little momentum, every day.'}</h1><p>{tab === 'pipeline' ? 'A little clarity for your next big thing. Let’s make it happen.' : tab === 'contacts' ? 'Your fictional customers, collaborators, and future partners.' : 'Every change tells a story. Here’s what’s been happening.'}</p></div><button data-tour="new" className="button button-dark" disabled={!canEdit || tab === 'activity'} onClick={() => { setError(''); setDialog({ type: tab === 'contacts' ? 'contact' : 'deal' }); }}><Plus size={16}/>{tab === 'contacts' ? 'New contact' : 'New deal'}</button></div>
          {!canEdit && <div className="viewer-banner"><ShieldCheck size={16}/>You’re viewing as a guest. Switch to Editor in the dock to make changes.</div>}
          {error && !dialog && <div className="error-banner" role="alert">{error}<button type="button" onClick={() => { setError(''); demo.setRole(snapshot.role); }}>Retry</button></div>}
          <section className="metric-grid" aria-label="Workspace totals">
            <div className="metric"><div><span>Open pipeline</span><span className="metric-icon"><BarChart3 size={15}/></span></div><strong>{money(total)}</strong><small><span className="metric-dot olive"/>{openDeals.length} opportunities in motion</small><div className="spark-bars" aria-hidden="true">{[30,44,38,57,51,65,58,74,64,85,75,94].map((h,i) => <i key={i} style={{ height: `${h}%` }}/>)}</div></div>
            <div className="metric"><div><span>Won business</span><span className="metric-icon"><Check size={15}/></span></div><strong>{money(won)}</strong><small><span className="metric-dot green"/>{wonDeals.length} deals worth celebrating</small></div>
            <div className="metric"><div><span>People in your corner</span><span className="metric-icon"><Users size={15}/></span></div><strong>{data?.contacts.length ?? '—'}<span className="metric-unit">contacts</span></strong><small><span className="avatar-stack">{['AC','JE','RM'].map(n => <span key={n}>{n}</span>)}</span>Room for your next connection</small></div>
          </section>
          {tab !== 'activity' && <div className="board-tools"><div className="board-title"><h2>{tab === 'pipeline' ? 'Deal pipeline' : 'All contacts'}</h2><span className="count-badge">{tab === 'pipeline' ? filtered.length : contacts.length}</span></div><div className="board-actions"><label className="search-box"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={tab === 'pipeline' ? 'Search deals…' : 'Search contacts…'} aria-label={tab === 'pipeline' ? 'Search deals' : 'Search contacts'}/>{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={13}/></button>}</label>{tab === 'pipeline' && <div className="view-switch"><button className={view === 'board' ? 'active' : ''} aria-label="Board view" aria-pressed={view === 'board'} onClick={() => setView('board')}><LayoutGrid size={15}/></button><button className={view === 'list' ? 'active' : ''} aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={16}/></button></div>}<button className="icon-button export-button" aria-label="Export demo data" title="Export demo data" onClick={exportData}><Download size={16}/></button></div></div>}
          {!data ? <div className="loading-workspace" role="status">Preparing your workspace…</div> : tab === 'pipeline' ? <div data-tour="pipeline">
            {view === 'board' ? <div className="kanban">{stages.map(stage => <section className={`kanban-column column-${stage}`} key={stage} aria-label={`${stageLabels[stage]} deals`}><header><div><span className={`stage-dot stage-${stage}`}/><h3>{stageLabels[stage]}</h3><span>{filtered.filter(d => d.stage === stage).length}</span></div><small>{money(filtered.filter(d => d.stage === stage).reduce((sum,d) => sum+d.value,0))}</small></header><div className="deal-stack">{filtered.filter(d => d.stage === stage).map(deal => <article className="deal-card" key={deal.id}><button className="deal-card-main" onClick={() => { setError(''); setDialog({ type: 'deal', deal }); }} aria-label={`Open ${deal.name}`}><span className="deal-company"><span className={`company-mark mark-${deal.company.length % 4}`}>{deal.company[0]}</span>{deal.company}</span><h4>{deal.name}</h4><strong>{money(deal.value)}</strong></button><footer><span className={`avatar avatar-${deal.owner.length % 3}`} title={deal.owner}>{initials(deal.owner)}</span><span>{deal.owner}</span>{stage !== 'won' ? <button className="move-button" disabled={!canEdit || busy} aria-label={`Move ${deal.name} to ${stageLabels[stages[stages.indexOf(stage)+1]]}`} title="Move to next stage" onClick={() => moveDeal(deal)}><ArrowRight size={14}/></button> : <span className="won-check"><Check size={13}/>Won</span>}</footer></article>)}{filtered.filter(d => d.stage === stage).length === 0 && <div className="empty-column"><span>Nothing here yet</span><small>{query ? 'Try a different search' : 'Good things take a first step'}</small></div>}</div><button className="add-column" disabled={!canEdit} onClick={() => { setError(''); setDialog({ type: 'deal', deal: { id: '', name: '', company: '', value: 0, stage, owner: 'You' } }); }}><Plus size={13}/>Add a deal</button></section>)}</div> : <div className="table-wrap"><table><thead><tr><th>Opportunity</th><th>Company</th><th>Value</th><th>Stage</th><th>Owner</th></tr></thead><tbody>{filtered.map(deal => <tr key={deal.id}><td><button className="text-button" onClick={() => setDialog({ type: 'deal', deal })}>{deal.name}</button></td><td>{deal.company}</td><td>{money(deal.value)}</td><td><span className={`stage-pill pill-${deal.stage}`}>{stageLabels[deal.stage]}</span></td><td>{deal.owner}</td></tr>)}</tbody></table>{!filtered.length && <div className="empty-table">No deals found. Create one or try a different search.</div>}</div>}
          </div> : tab === 'contacts' ? <div className="table-wrap"><table><thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Role</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{contacts.map(contact => <tr key={contact.id}><td><span className="contact-name"><span className={`avatar avatar-${contact.name.length % 3}`}>{initials(contact.name)}</span>{contact.name}</span></td><td>{contact.company}</td><td>{contact.email}</td><td>{contact.title || '—'}</td><td><button className="icon-button" disabled={!canEdit} aria-label={`Delete ${contact.name}`} onClick={() => { setError(''); setDialog({ type: 'delete', item: contact, collection: 'contacts' }); }}><Trash2 size={14}/></button></td></tr>)}</tbody></table>{!contacts.length && <div className="empty-table">No contacts yet. Add someone fictional to get started.</div>}</div> : <section className="activity-panel"><h2>Workspace activity</h2><p>Sample history and changes made in this tab.</p>{data.activities.map((item,index) => <div className="activity-item" key={item.id}><span className="activity-node"><Check size={14}/></span><div><strong>{item.text}</strong><small>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(item.at))}</small></div>{index === 0 && <span className="latest-badge">Latest</span>}</div>)}{!data.activities.length && <div className="empty-table">Your next action will show up here.</div>}</section>}
          <div className="workspace-footnote"><span><ShieldCheck size={13}/>Sample data. No account needed.</span><span>{snapshot.requests} API responses served in your browser</span></div>
        </div>
      </main>
    </div>
    <DemoDock demo={demo} title="Folio, powered by DemoDock" onReset={() => { setQuery(''); setDialog(null); }}/>
    {toast && <div className="app-toast" role="status"><Check size={15}/>{toast}</div>}
    {dialog && <Modal title={dialog.type === 'deal' ? (dialog.deal?.id ? 'Deal details' : 'A new opportunity') : dialog.type === 'contact' ? 'A new connection' : 'Delete this item?'} onClose={() => { setDialog(null); setError(''); }}>
      {error && <div className="form-error" role="alert">{error}</div>}
      {dialog.type === 'deal' ? <form onSubmit={saveDeal}>
        <p className="modal-intro">This is your space to experiment. Please use fictional details.</p>
        <label>Deal name<input name="name" required maxLength={100} placeholder="e.g. A fresh new website" defaultValue={dialog.deal?.name} disabled={!canEdit} autoFocus/></label>
        <label>Company<input name="company" required maxLength={100} placeholder="e.g. Acorn Studio" defaultValue={dialog.deal?.company} disabled={!canEdit}/></label>
        <div className="form-row"><label>Value (USD)<input name="value" type="number" min="0" max="100000000" step="0.01" required defaultValue={dialog.deal?.value ?? ''} placeholder="5000" disabled={!canEdit}/></label><label>Stage<select name="stage" defaultValue={dialog.deal?.stage ?? 'lead'} disabled={!canEdit}>{stages.map(s => <option key={s} value={s}>{stageLabels[s]}</option>)}</select></label></div>
        <footer className="modal-actions">{dialog.deal?.id && canEdit && <button className="button button-danger" type="button" onClick={() => setDialog({ type: 'delete', item: dialog.deal!, collection: 'deals' })}><Trash2 size={14}/>Delete</button>}<span/><button type="button" className="button button-outline" onClick={() => setDialog(null)}>Close</button>{canEdit && <button className="button button-dark" disabled={busy}>{busy ? 'Saving…' : dialog.deal?.id ? 'Save changes' : 'Create deal'}</button>}</footer>
      </form> : dialog.type === 'contact' ? <form onSubmit={saveContact}><p className="modal-intro">Add a fictional person to your demo workspace.</p><label>Full name<input name="name" required maxLength={100} placeholder="e.g. Alex Rivera" autoFocus/></label><label>Company<input name="company" required maxLength={100} placeholder="e.g. Acorn Studio"/></label><label>Email<input name="email" type="email" required maxLength={254} placeholder="alex@acorn.example"/></label><label>Job title<input name="title" maxLength={100} placeholder="e.g. Founder"/></label><footer className="modal-actions"><span/><button className="button button-outline" type="button" onClick={() => setDialog(null)}>Cancel</button><button className="button button-dark" disabled={busy}>{busy ? 'Saving…' : 'Create contact'}</button></footer></form> : <><p className="modal-intro">Remove <strong>{dialog.item.name}</strong> from this demo workspace? You can restore the sample dataset with Reset.</p><footer className="modal-actions"><span/><button className="button button-outline" onClick={() => setDialog(null)}>Keep it</button><button className="button button-danger-solid" disabled={busy} onClick={() => void mutate(`${dialog.collection}/${dialog.item.id}`, 'DELETE', undefined, 'Item deleted')}>{busy ? 'Deleting…' : 'Delete item'}</button></footer></>}
    </Modal>}
  </div>;
}
