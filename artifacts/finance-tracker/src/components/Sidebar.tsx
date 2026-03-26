import { Link, useLocation } from "wouter";
import { LayoutDashboard, Receipt, PieChart, Tags, Settings, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/reports", label: "Reports", icon: PieChart },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 h-screen fixed left-0 top-0 glass-panel border-y-0 border-l-0 flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <Wallet className="text-white w-6 h-6" />
        </div>
        <span className="font-display font-bold text-xl text-white tracking-tight">FinTrack</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-inner"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "scale-110" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="p-4 rounded-xl bg-gradient-to-b from-white/5 to-transparent border border-white/5">
          <p className="text-xs text-muted-foreground font-medium mb-1">Local Storage</p>
          <p className="text-sm text-white/80">Data is saved securely on your device.</p>
        </div>
      </div>
    </div>
  );
}
