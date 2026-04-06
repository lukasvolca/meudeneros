import { Link, useLocation } from "wouter";
import { LayoutDashboard, Receipt, PieChart, Tags, Settings, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: Receipt },
  { href: "/reports", label: "Relatórios", icon: PieChart },
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 h-screen fixed left-0 top-0 glass-panel border-y-0 border-l-0 flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <Wallet className="text-white w-6 h-6" />
        </div>
        <span className="font-display font-bold text-xl text-white tracking-tight">Meu Deneros</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
          <p className="text-xs text-muted-foreground font-medium mb-1">Armazenamento Local</p>
          <p className="text-sm text-white/70">Seus dados ficam salvos neste dispositivo.</p>
        </div>
      </div>
    </div>
  );
}
