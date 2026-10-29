import { Construction } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
  items: DemoSubApp[];
}

/* Hero page for a demo desk: app icon + name, one-line thesis, sub-apps as
 * placeholder tiles (each marked "not wired"), and an explicit not-wired state.
 * Steel-vault aesthetic; no fabricated data, no live chain read. */
export function DemoDesk({ spec }: { spec: DemoDeskSpec }) {
  const Icon = spec.icon;

  return (
    <div className="h-full flex flex-col overflow-auto p-6">
      {/* Hero: icon + name */}
      <div className="mb-2 flex items-start gap-4">
        {Icon && (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/5 text-primary">
            <Icon className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/70">
            {spec.code}
          </div>
          <h2 className="text-2xl font-semibold leading-tight tracking-wide">{spec.title}</h2>
        </div>
      </div>

      {/* Thesis */}
      <p className="mb-6 mt-2 text-sm text-muted-foreground">{spec.thesis}</p>

      {/* Sub-app tiles */}
      {spec.items.length === 0 ? (
        <div className="glass-panel p-4 text-sm text-muted-foreground">
          No sub-apps listed — this desk is a single surface.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {spec.items.map((item) => (
            <div key={item.name} className="glass-panel flex flex-col gap-1.5 p-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              {item.detail && (
                <span className="pl-3.5 text-xs leading-snug text-muted-foreground/70">
                  {item.detail}
                </span>
              )}
              <span className="mt-auto pt-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">
                not wired
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-start gap-2 pt-6 text-xs text-muted-foreground">
        <Construction className="mt-px h-4 w-4 shrink-0" />
        <span>
          Not wired — demo surface. No live chain read, no data, no signature.
          Sub-apps are placeholders; on-chain wiring arrives in a later gate.
        </span>
      </div>
    </div>
  );
}
