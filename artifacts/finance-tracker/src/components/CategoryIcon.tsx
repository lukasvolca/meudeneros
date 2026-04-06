import * as Icons from "lucide-react";
import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category } from "@/lib/finance";

interface CategoryIconProps {
  category?: Category;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { wrapper: "w-7 h-7", icon: "w-3.5 h-3.5", text: "text-xs" },
  md: { wrapper: "w-9 h-9", icon: "w-4 h-4", text: "text-sm" },
  lg: { wrapper: "w-11 h-11", icon: "w-5 h-5", text: "text-base" },
  xl: { wrapper: "w-14 h-14", icon: "w-7 h-7", text: "text-lg" },
};

export function CategoryIcon({ category, size = "md", className }: CategoryIconProps) {
  const s = sizeMap[size];

  if (!category) {
    return (
      <div className={cn(s.wrapper, "rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0", className)}>
        <Tag className={cn(s.icon, "text-muted-foreground")} />
      </div>
    );
  }

  const icon = category.icon;

  if (icon?.startsWith("data:")) {
    return (
      <div className={cn(s.wrapper, "rounded-2xl overflow-hidden flex-shrink-0", className)}>
        <img src={icon} alt={category.name} className="w-full h-full object-cover" />
      </div>
    );
  }

  if (icon) {
    const Icon = (Icons as any)[icon] as Icons.LucideIcon | undefined;
    if (Icon) {
      return (
        <div className={cn(s.wrapper, "rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0", className)}>
          <Icon className={cn(s.icon, "text-primary")} />
        </div>
      );
    }
  }

  // Fallback: first letter
  return (
    <div className={cn(s.wrapper, "rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 font-bold text-white/60", s.text, className)}>
      {category.name.charAt(0).toUpperCase()}
    </div>
  );
}
