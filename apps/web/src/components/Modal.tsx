import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const element = dialog.current!;
    element.showModal();
    const cancel = (event: Event) => { event.preventDefault(); closeRef.current(); };
    element.addEventListener('cancel', cancel);
    return () => { element.removeEventListener('cancel', cancel); element.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="modal" aria-labelledby="modal-title" onClick={e => { if (e.target === dialog.current) { const rect = dialog.current.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose(); } }}>
    <header><div><span className="eyebrow">FOLIO WORKSPACE</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={20}/></button></header>{children}
  </dialog>;
}
