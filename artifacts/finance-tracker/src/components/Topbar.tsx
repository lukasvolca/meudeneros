import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";

export function Topbar({ title }: { title: string }) {
  const { currentDate, setCurrentDate } = useFinance();

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <header className="h-16 px-8 flex items-center justify-between bg-background/90 sticky top-0 z-40 border-b border-white/5">
      <h1 className="text-xl font-display font-bold text-white">{title}</h1>

      <div className="flex items-center gap-3 bg-white/5 rounded-full px-2 py-1 border border-white/10">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold min-w-[130px] text-center text-sm capitalize">
          {format(currentDate, "MMMM yyyy", { locale: ptBR })}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
