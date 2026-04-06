import { useRef } from "react";
import { Upload, X } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

export const CATEGORY_ICONS: { name: string; label: string }[] = [
  { name: "ShoppingCart", label: "Compras" },
  { name: "Coffee", label: "Café" },
  { name: "Car", label: "Carro" },
  { name: "Home", label: "Casa" },
  { name: "Briefcase", label: "Trabalho" },
  { name: "Heart", label: "Saúde" },
  { name: "Music", label: "Música" },
  { name: "Film", label: "Cinema" },
  { name: "Plane", label: "Viagem" },
  { name: "Smartphone", label: "Tecnologia" },
  { name: "Dumbbell", label: "Academia" },
  { name: "BookOpen", label: "Educação" },
  { name: "Pizza", label: "Refeição" },
  { name: "DollarSign", label: "Renda" },
  { name: "CreditCard", label: "Cartão" },
  { name: "Gift", label: "Presente" },
  { name: "Zap", label: "Energia" },
  { name: "Wifi", label: "Internet" },
  { name: "ShoppingBag", label: "Roupas" },
  { name: "Utensils", label: "Restaurante" },
  { name: "Bus", label: "Transporte" },
  { name: "GraduationCap", label: "Escola" },
  { name: "Wrench", label: "Manutenção" },
  { name: "Shirt", label: "Vestuário" },
  { name: "Building2", label: "Aluguel" },
  { name: "TrendingUp", label: "Investimento" },
  { name: "Wallet", label: "Carteira" },
  { name: "Scissors", label: "Serviços" },
  { name: "Star", label: "Favorito" },
  { name: "Baby", label: "Criança" },
  { name: "Sun", label: "Lazer" },
  { name: "Tag", label: "Outros" },
  { name: "Cat", label: "Pet" },
  { name: "Skull", label: "Caveira" },
];

interface CategoryIconPickerProps {
  value?: string;
  onChange: (icon: string) => void;
  onClose?: () => void;
}

export function CategoryIconPicker({ value, onChange, onClose }: CategoryIconPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const SIZE = 64;
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        // Center-crop to square before resizing
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, SIZE, SIZE);
        const compressed = canvas.toDataURL("image/jpeg", 0.82);
        onChange(compressed);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="glass-panel border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Escolher ícone</p>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-8 gap-1.5">
        {CATEGORY_ICONS.map(({ name, label }) => {
          const Icon = (Icons as any)[name] as Icons.LucideIcon | undefined;
          if (!Icon) return null;
          const isSelected = value === name;
          return (
            <button
              key={name}
              type="button"
              title={label}
              onClick={() => onChange(name)}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}

        {/* Upload button */}
        <button
          type="button"
          title="Enviar imagem"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-colors border border-dashed",
            value?.startsWith("data:")
              ? "border-primary bg-primary/10 text-primary"
              : "border-white/20 text-muted-foreground hover:border-white/40 hover:text-white"
          )}
        >
          {value?.startsWith("data:") ? (
            <img src={value} alt="custom" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {value?.startsWith("data:") && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Imagem personalizada selecionada</span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-destructive hover:text-destructive/80 transition-colors"
          >
            Remover
          </button>
        </div>
      )}
    </div>
  );
}
