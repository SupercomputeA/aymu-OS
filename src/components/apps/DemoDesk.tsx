import { Construction } from 'lucide-react';

export interface DemoSubApp {
  name: string;
  detail?: string;
}

export interface DemoDeskSpec {
  code: string;
  title: string;
  role: string;
  items: DemoSubApp[];
}

/* Shared demo-desk surface: desk name + one-line role + sub-app placeholder
 * tiles + an explicit "not wired" state. Steel-vault aesthetic, no fabricated
 * data, no live chain read. */
export function DemoDesk({ spec }: { spec: DemoDeskSpec }) {
  return (
    <div className="h-full flex flex-col overflow-auto p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="px-2 py-1 rounded text-xs font-mono tracking-[0.2em] border border-primary/40 text-primary">
          {spec.code}
        </span>
        <h2 className="text-xl font-semibold tracking-wide">{spec.title}</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-6">{spec.role}</p>

      {spec.items.length === 0 ? (
        <div className="glass-panel p-4 text-sm text-muted-foreground">
          No sub-apps listed — this desk is a single surface.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {spec.items.map((item) => (
            <div key={item.name} className="glass-panel p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              {item.detail && (
                <span className="text-xs text-muted-foreground/70 pl-3.5 leading-snug">
                  {item.detail}
                </span>
              )}
              <span className="mt-auto pt-1 text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider">
                not wired
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto pt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <Construction className="w-4 h-4 mt-px shrink-0" />
        <span>
          Not wired — demo surface. No live chain read, no data, no signature.
          Sub-apps are placeholders; on-chain wiring arrives in a later gate.
        </span>
      </div>
    </div>
  );
}
