import { Construction } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AppLayout } from './AppLayout';

export interface DemoSubApp {
  name: string;
  detail?: string;
}

export interface DemoDeskSpec {
  code: string;
  title: string;
  /** One-line thesis — the desk's context in the steel-vault narrative voice. */
  thesis: string;
  icon?: LucideIcon;
  /** Optional disambiguation note rendered under the tiles. */
  note?: string;
  items: DemoSubApp[];
}

/* Hero page for a demo desk: shared AppLayout header + thesis, sub-apps as
 * placeholder tiles (each marked "not wired"), and an explicit not-wired state.
 * Steel-vault aesthetic; no fabricated data, no live chain read. */
export function DemoDesk({ spec }: { spec: DemoDeskSpec }) {
  return (
    <AppLayout code={spec.code} title={spec.title} thesis={spec.thesis} icon={spec.icon}>
      {spec.items.length === 0 ? (
        <div className="glass-panel p-4 text-sm text-muted-foreground">
          No sub-apps listed — this desk is a single surface.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {spec.items.map((item) => (
            <div key={item.name} className="glass-panel flex flex-col gap-2 p-4">
              <div className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                <span className="text-base font-medium">{item.name}</span>
              </div>
              {item.detail && (
                <span className="pl-4 text-sm leading-snug text-muted-foreground/70">
                  {item.detail}
                </span>
              )}
              <span className="mt-auto pt-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground/50">
                not wired
              </span>
            </div>
          ))}
        </div>
      )}

      {spec.note && <p className="mt-4 text-sm text-muted-foreground">{spec.note}</p>}

      <div className="mt-auto flex items-start gap-2 pt-6 text-sm text-muted-foreground">
        <Construction className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Not wired — demo surface. No live chain read, no data, no signature.
          Sub-apps are placeholders; on-chain wiring arrives in a later gate.
        </span>
      </div>
    </AppLayout>
  );
}
