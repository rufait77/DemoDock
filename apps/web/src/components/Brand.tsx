export function Brand({ light = false }: { light?: boolean }) {
  return <a className={`brand ${light ? 'brand-light' : ''}`} href="/" aria-label="DemoDock home"><svg viewBox="0 0 32 32" width="29" height="29" fill="none" aria-hidden="true"><rect width="32" height="32" rx="9" fill="currentColor"/><path d="M8 9h10a7 7 0 0 1 0 14H8V9Zm5 5v4h5a2 2 0 0 0 0-4h-5Z" fill="#d6f48b"/></svg><span>demodock<span className="brand-dot">.</span></span></a>;
}
