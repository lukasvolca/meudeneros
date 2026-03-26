import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  amount: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}

export function SummaryCard({ title, amount, icon, trend, trendUp, colorClass }: SummaryCardProps) {
  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-110 transform">
        {icon}
      </div>
      
      <div className="relative z-10">
        <p className="text-muted-foreground font-medium text-sm mb-2">{title}</p>
        <h3 className={cn("text-3xl font-display font-bold tracking-tight mb-4", colorClass)}>
          {amount}
        </h3>
        
        {trend && (
          <div className="flex items-center gap-2 text-sm">
            <span className={cn(
              "px-2 py-1 rounded-full bg-white/5 border border-white/10 font-medium",
              trendUp ? "text-success" : trendUp === false ? "text-destructive" : "text-white/70"
            )}>
              {trend}
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
