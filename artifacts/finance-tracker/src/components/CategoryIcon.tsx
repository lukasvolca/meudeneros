import * as Icons from "lucide-react";
import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category } from "@/lib/finance";

interface CategoryIconProps {
  category?: Category;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  typeOverride?: "income" | "expense";
}

const sizeMap = {
  sm: { wrapper: "w-7 h-7", icon: "w-3.5 h-3.5", text: "text-xs" },
  md: { wrapper: "w-9 h-9", icon: "w-4 h-4", text: "text-sm" },
  lg: { wrapper: "w-11 h-11", icon: "w-5 h-5", text: "text-base" },
  xl: { wrapper: "w-14 h-14", icon: "w-7 h-7", text: "text-lg" },
};

export function CategoryIcon({ category, size = "md", className, typeOverride }: CategoryIconProps) {
  const s = sizeMap[size];

  if (!category) {
    return (
      <div className={cn(s.wrapper, "rounded-2xl bg-white/5 flex items-center justify-center shrink-0", className)}>
        <Tag className={cn(s.icon, "text-muted-foreground")} />
      </div>
    );
  }

  const icon = category.icon;

  if (icon?.startsWith("data:")) {
    return (
      <div className={cn(s.wrapper, "rounded-2xl overflow-hidden shrink-0", className)}>
        <img src={icon} alt={category.name} className="w-full h-full object-cover" />
      </div>
    );
  }

  const isIncome = (typeOverride ?? category.type) === "income";
  const colorBg = isIncome ? "bg-primary/10" : "bg-destructive/10";
  const colorText = isIncome ? "text-primary" : "text-destructive";

  if (icon) {
    const Icon = (Icons as any)[icon] as Icons.LucideIcon | undefined;
    if (Icon) {
      return (
        <div className={cn(s.wrapper, "rounded-2xl flex items-center justify-center shrink-0", colorBg, className)}>
          <Icon className={cn(s.icon, colorText)} />
        </div>
      );
    }
  }

  return (
    <div className={cn(s.wrapper, "rounded-2xl flex items-center justify-center shrink-0 font-bold", s.text, colorBg, colorText, className)}>
      {category.name.charAt(0).toUpperCase()}
    </div>
  );
}
