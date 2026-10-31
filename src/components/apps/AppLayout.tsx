import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface AppLayoutProps {
  code: string;
  title: string;
  thesis: string;
  icon?: LucideIcon;
  children: ReactNode;
}

/* Shared app template — every desk uses this so clarity lives in the same
 * place each time: header (icon + code + title) → hero thesis → content. */
export function AppLayout({ code, title, thesis, icon: Icon, children }: AppLayoutProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-3 flex items-start gap-4">
        {Icon && (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/5 text-primary">
            <Icon className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-primary/70">
            {code}
          </div>
          <h2 className="text-2xl font-semibold leading-tight tracking-wide">{title}</h2>
        </div>
      </div>

      <p className="mb-5 mt-1 text-base text-muted-foreground">{thesis}</p>

      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
