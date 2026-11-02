import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Github } from './Github';
import { Brand } from './Brand';
export const REPO = 'https://github.com/rufait77/DemoDock';
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="site-container nav-inner"><Brand/><nav className={open ? 'site-nav nav-open' : 'site-nav'} aria-label="Main navigation"><a href="/#how-it-works">How it works</a><a href="/docs">Documentation</a><a href={REPO} target="_blank" rel="noreferrer"><Github size={16}/>GitHub<ArrowUpRight size={12}/></a></nav><a className="button button-dark header-cta" href="/demo">Try the playground<ArrowUpRight size={14}/></a><button className="icon-button mobile-menu" aria-label="Toggle navigation" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? <X/> : <Menu/>}</button></div></header>;
}
export function SiteFooter() {
  return <footer className="site-footer site-container"><div><Brand/><p>A small toolkit. A better first impression.</p></div><div className="footer-right"><a href="/docs">Documentation</a><a href={REPO}>Source code ↗</a><a href={`${REPO}/blob/main/LICENSE`}>MIT license</a><span>Built by <a href="https://github.com/rufait77">Rufait Islam Nahin</a></span></div></footer>;
}
