export const stages = ['lead', 'qualified', 'proposal', 'won'] as const;
export type Stage = typeof stages[number];
export interface Deal { id: string; name: string; company: string; value: number; stage: Stage; owner: string }
export interface Contact { id: string; name: string; company: string; email: string; title: string }
export interface Activity { id: string; text: string; at: string }
export interface Workspace { deals: Deal[]; contacts: Contact[]; activities: Activity[] }
export const stageLabels: Record<Stage, string> = { lead: 'New lead', qualified: 'Qualified', proposal: 'Proposal', won: 'Won' };
export function seedWorkspace(): Workspace {
  return {
    deals: [
      { id: 'd1', name: 'Brand website', company: 'Orbit Studio', value: 8400, stage: 'lead', owner: 'Alex' },
      { id: 'd2', name: 'Customer portal', company: 'Forma', value: 12500, stage: 'lead', owner: 'Sam' },
      { id: 'd3', name: 'Design system', company: 'Mint & Co.', value: 6800, stage: 'qualified', owner: 'Alex' },
      { id: 'd4', name: 'Mobile experience', company: 'Layers', value: 18000, stage: 'qualified', owner: 'Jamie' },
      { id: 'd5', name: 'Product launch', company: 'Northstar', value: 24000, stage: 'proposal', owner: 'Sam' },
      { id: 'd6', name: 'Analytics dashboard', company: 'Plain', value: 9600, stage: 'proposal', owner: 'Jamie' },
      { id: 'd7', name: 'Commerce refresh', company: 'Goodkind', value: 15200, stage: 'won', owner: 'Alex' },
      { id: 'd8', name: 'Member platform', company: 'Common Ground', value: 11200, stage: 'won', owner: 'Sam' }
    ],
    contacts: [
      { id: 'c1', name: 'Avery Chen', company: 'Orbit Studio', email: 'avery@orbit.example', title: 'Founder' },
      { id: 'c2', name: 'Jordan Ellis', company: 'Forma', email: 'jordan@forma.example', title: 'Head of product' },
      { id: 'c3', name: 'Riley Morgan', company: 'Mint & Co.', email: 'riley@mint.example', title: 'Design director' },
      { id: 'c4', name: 'Taylor Park', company: 'Layers', email: 'taylor@layers.example', title: 'Co-founder' },
      { id: 'c5', name: 'Casey Rivera', company: 'Northstar', email: 'casey@northstar.example', title: 'Product manager' }
    ],
    activities: [
      { id: 'a1', text: 'Alex won Commerce refresh for Goodkind', at: '2026-11-02T09:30:00Z' },
      { id: 'a2', text: 'Sam moved Product launch to Proposal', at: '2026-11-02T08:15:00Z' },
      { id: 'a3', text: 'Jamie added Analytics dashboard', at: '2026-11-01T15:00:00Z' }
    ]
  };
}
export function busyWorkspace(): Workspace {
  const data = seedWorkspace();
  data.deals.push(
    { id: 'd9', name: 'Booking experience', company: 'Fieldwork', value: 7200, stage: 'lead', owner: 'Jamie' },
    { id: 'd10', name: 'Internal tooling', company: 'Fern', value: 14000, stage: 'qualified', owner: 'Sam' },
    { id: 'd11', name: 'Platform redesign', company: 'Outline', value: 32000, stage: 'proposal', owner: 'Alex' },
    { id: 'd12', name: 'Checkout flow', company: 'Acorn', value: 4800, stage: 'won', owner: 'Jamie' }
  );
  return data;
}
export const emptyWorkspace = (): Workspace => ({ deals: [], contacts: [], activities: [] });
export function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== 'object') return false;
  const w = value as Workspace;
  return Array.isArray(w.deals) && w.deals.every(d => typeof d.id === 'string' && typeof d.name === 'string' && typeof d.company === 'string' && Number.isFinite(d.value) && d.value >= 0 && stages.includes(d.stage) && typeof d.owner === 'string')
    && Array.isArray(w.contacts) && w.contacts.every(c => ['id','name','company','email','title'].every(key => typeof c[key as keyof Contact] === 'string'))
    && Array.isArray(w.activities) && w.activities.every(a => typeof a.id === 'string' && typeof a.text === 'string' && typeof a.at === 'string');
}
