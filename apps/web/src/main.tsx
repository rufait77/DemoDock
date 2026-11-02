import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './styles.css';
import { Landing } from './pages/Landing';
import { Docs } from './pages/Docs';

const root = createRoot(document.getElementById('root')!);
const path = window.location.pathname.replace(/\/$/, '') || '/';
if (path === '/demo') {
  document.title = 'Folio playground — DemoDock';
  root.render(<div className="boot-screen"><span className="boot-logo">d.</span><h1>Your workspace is getting ready.</h1><p>Preparing a little world, just for you.</p><span className="loading-line"/></div>);
  void Promise.all([import('./demo/runtime'), import('./demo/Workspace')]).then(async ([{ demo }, { default: Workspace }]) => {
    await demo.start();
    root.render(<Workspace/>);
  }).catch(error => {
    console.error('DemoDock could not start:', error);
    root.render(<div className="boot-screen"><span className="boot-logo">d.</span><h1>The demo couldn’t start.</h1><p>DemoDock needs service workers on HTTPS or localhost. No application requests were sent.</p><p>Try a supported browser with site storage enabled.</p><a className="button button-dark" href="/demo">Try again</a><a href="/docs#limits">Read the requirements</a></div>);
  });
} else if (path === '/docs') {
  document.title = 'Documentation — DemoDock'; root.render(<Docs/>);
} else if (path === '/') root.render(<Landing/>);
else root.render(<div className="boot-screen"><span className="boot-logo">d.</span><h1>This dock is empty.</h1><p>We couldn’t find that page.</p><a className="button button-dark" href="/">Back to DemoDock</a></div>);
