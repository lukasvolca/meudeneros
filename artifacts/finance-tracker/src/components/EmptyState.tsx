import { Plus } from "lucide-react";
import { Link } from "wouter";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="w-full min-h-[400px] glass-panel rounded-3xl flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/40 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10">
        <img
          src={`${import.meta.env.BASE_URL}images/empty-state-art.png`}
          alt="Sem dados"
          className="w-40 h-40 object-contain mx-auto mb-6 opacity-80"
        />
        <h3 className="text-2xl font-display font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm leading-relaxed">{description}</p>

        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-background font-bold hover:bg-white/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
