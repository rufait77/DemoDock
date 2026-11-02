import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { DemoStore } from './store.js';

export function useDemo<T extends object>(demo: DemoStore<T>) {
  return useSyncExternalStore(demo.subscribe, demo.getSnapshot, demo.getSnapshot);
}

export interface DemoDockProps<T extends object> {
  demo: DemoStore<T>;
  title?: string;
  onReset?: () => void;
  className?: string;
}

export function DemoDock<T extends object>({ demo, title = 'Demo workspace', onReset, className = '' }: DemoDockProps<T>) {
  const snapshot = useDemo(demo);
  const [confirmReset, setConfirmReset] = useState(false);
  const [step, setStep] = useState(-1);
  const [notice, setNotice] = useState('');
  const tour = demo.options.tour ?? [];
  const previousFocus = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const active = tour[step];
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!active) return;
    let element: Element | null = null;
    try { element = document.querySelector(active.target); } catch { /* Missing target still displays the tour explanation. */ }
    element?.setAttribute('data-demodock-highlight', 'true');
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return () => { element?.removeAttribute('data-demodock-highlight'); };
  }, [active]);
  useEffect(() => {
    if (step < 0) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setStep(-1); previousFocus.current?.focus(); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [step]);
  const finish = () => { setStep(-1); previousFocus.current?.focus(); };
  return <>
    <aside className={`dd-dock ${className}`} aria-label="DemoDock controls">
      <div className="dd-identity"><span className="dd-status"/><span><strong>{title}</strong><small>Synthetic data · {snapshot.storage === 'memory' ? 'in memory' : 'saved in this tab'}</small></span></div>
      <div className="dd-control"><label htmlFor={`${demo.options.id}-scenario`}>Scenario</label><select id={`${demo.options.id}-scenario`} value={snapshot.scenario} onChange={e => { demo.setScenario(e.target.value); setNotice('Scenario loaded. A fresh workspace is ready.'); }}>
        {demo.options.scenarios.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></div>
      <div className="dd-control"><label htmlFor={`${demo.options.id}-role`}>View as</label><select id={`${demo.options.id}-role`} value={snapshot.role} onChange={e => { demo.setRole(e.target.value); setNotice(`Switched to ${demo.options.roles.find(role => role.id === e.target.value)?.label}.`); }}>
        {demo.options.roles.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></div>
      <div className="dd-actions">
        {tour.length > 0 && <button type="button" onClick={() => { previousFocus.current = document.activeElement as HTMLElement; setStep(0); setTimeout(() => panelRef.current?.focus(), 0); }}>Take a tour <span aria-hidden="true">↗</span></button>}
        <button type="button" className="dd-reset" onClick={() => setConfirmReset(!confirmReset)} aria-expanded={confirmReset}>↺ Reset</button>
      </div>
      {confirmReset && <div className="dd-confirm"><strong>Reset this workspace?</strong><p>Your changes will be replaced with the current scenario’s sample data.</p><div><button type="button" onClick={() => setConfirmReset(false)}>Keep changes</button><button type="button" className="dd-primary" onClick={() => { demo.reset(); setConfirmReset(false); onReset?.(); setNotice('Workspace reset. Explore again.'); }}>Reset workspace</button></div></div>}
      <span className="dd-sr-only" role="status">{notice}</span>
    </aside>
    {notice && <div className="dd-notice" aria-hidden="true">✓ {notice}</div>}
    {active && <div className="dd-tour" role="region" aria-label="Product tour" tabIndex={-1} ref={panelRef}>
      <div className="dd-tour-top"><span>QUICK TOUR · {step + 1} / {tour.length}</span><button type="button" aria-label="Close tour" onClick={finish}>×</button></div>
      <h3>{active.title}</h3><p>{active.description}</p><div className="dd-tour-bottom"><button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button><button type="button" className="dd-primary" onClick={() => step === tour.length - 1 ? finish() : setStep(step + 1)}>{step === tour.length - 1 ? 'Let me explore' : 'Next step →'}</button></div>
    </div>}
  </>;
}
