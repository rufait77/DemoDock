import { createDemo } from '@rufait77/demodock';
import { seedWorkspace, busyWorkspace, emptyWorkspace, isWorkspace } from './data';
import { workspaceHandlers } from './handlers';
export const demo = createDemo({
  id: 'folio-crm', version: 1,
  roles: [{ id: 'editor', label: 'Editor' }, { id: 'viewer', label: 'Viewer' }],
  scenarios: [
    { id: 'everyday', label: 'A working studio', seed: seedWorkspace },
    { id: 'growth', label: 'A busy quarter', seed: busyWorkspace },
    { id: 'empty', label: 'A fresh start', seed: emptyWorkspace }
  ],
  validateState: isWorkspace,
  handlers: store => workspaceHandlers(store),
  tour: [
    { target: '[data-tour="pipeline"]', title: 'A real place to explore', description: 'This is Folio, a fictional CRM. Open a deal to edit it, or use its arrow to move it through the pipeline. The app makes real HTTP requests, answered inside your browser.' },
    { target: '[data-tour="new"]', title: 'Make it your own', description: 'Create a deal with any fictional company. Your changes stay in this tab, including after a refresh. No account or shared database is involved.' },
    { target: '#folio-crm-role', title: 'Try another perspective', description: 'Switch to Viewer in the dock. The mock API rejects edits too, so you can demonstrate a complete read-only experience.' },
    { target: '#folio-crm-scenario', title: 'Every visitor gets a fresh start', description: 'Try an empty workspace or a busier quarter. Reset restores the selected scenario. These controls come from the reusable DemoDock SDK.' }
  ]
});
