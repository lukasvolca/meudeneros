import { format, subMonths, addMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";

export function Topbar({ title }: { title: string }) {
  const { currentDate, setCurrentDate } = useFinance();

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <header className="h-20 px-8 flex items-center justify-between backdrop-blur-md bg-background/80 sticky top-0 z-40 border-b border-white/5">
      <h1 className="text-2xl font-display font-bold text-white">{title}</h1>
      
      <div className="flex items-center gap-6">
        {/* Month Selector */}
        <div className="flex items-center gap-4 bg-white/5 rounded-full px-2 py-1 border border-white/10">
          <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold min-w-[120px] text-center text-sm">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications mock */}
        <button className="relative p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-muted-foreground hover:text-white">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-background"></span>
        </button>
        
        {/* Profile mock */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-primary p-[2px]">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center border border-transparent">
             <span className="font-bold text-sm">US</span>
          </div>
        </div>
      </div>
    </header>
  );
}
