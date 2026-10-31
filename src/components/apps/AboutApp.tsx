import { Orbit } from 'lucide-react';

interface AboutAppProps {
  windowId: string;
}

export function AboutApp({ windowId }: AboutAppProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6">
        <Orbit className="w-14 h-14 text-primary-foreground" strokeWidth={1.5} />
      </div>

      <h1 className="text-3xl font-light mb-1">
        <span className="font-semibold">Immersion OS</span>
      </h1>
      <p className="text-muted-foreground mb-6">Version 1.5.0</p>

      <div className="glass-panel p-6 max-w-md space-y-4 text-sm">
        <p>
          The sovereign Web3 desktop — an on-chain operating system experience.
        </p>

        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Framework</span>
            <span>React 18</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Language</span>
            <span>TypeScript</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Styling</span>
            <span>Tailwind CSS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Animations</span>
            <span>Framer Motion</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">State</span>
            <span>Zustand</span>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        SUPERCOMPUTE · fork of aymu-OS
      </p>
    </div>
  );
}
