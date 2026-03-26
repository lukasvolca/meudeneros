import { Layout } from "@/components/Layout";
import { useFinance } from "@/context/FinanceContext";
import { Download, Trash2, User, Shield, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { clearAllData, transactions } = useFinance();
  const { toast } = useToast();

  const handleClearData = () => {
    if (confirm("Are you sure? This will delete all your transactions and custom categories permanently.")) {
      clearAllData();
      toast({
        title: "Data Cleared",
        description: "All your local data has been wiped.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "finance_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    toast({
      title: "Export Successful",
      description: "Your data has been downloaded as JSON.",
    });
  };

  return (
    <Layout title="Settings">
      <div className="max-w-3xl space-y-8">
        
        {/* Profile Section (Visual) */}
        <section className="glass-panel p-8 rounded-3xl">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-500 to-primary p-[2px]">
              <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                 <User className="w-8 h-8 text-white/50" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold">Local User</h3>
              <p className="text-muted-foreground mt-1">Your data is stored locally on this device.</p>
              <button className="mt-4 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-display font-bold">Data Management</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-black/20 border border-white/5">
              <h4 className="font-semibold mb-2">Export Data</h4>
              <p className="text-sm text-muted-foreground mb-4">Download a JSON backup of all your transactions.</p>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium w-full justify-center"
              >
                <Download className="w-4 h-4" /> Export JSON
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10">
              <h4 className="font-semibold text-destructive mb-2">Danger Zone</h4>
              <p className="text-sm text-destructive/70 mb-4">Permanently delete all your local data.</p>
              <button 
                onClick={handleClearData}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-colors shadow-lg shadow-destructive/20 text-sm font-medium w-full justify-center"
              >
                <Trash2 className="w-4 h-4" /> Clear All Data
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="glass-panel p-8 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
            <Info className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xl font-display font-bold">About FinTrack</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            FinTrack is a premium, privacy-first personal finance tracker. 
            All data remains strictly on your device within your browser's local storage.
            Built with React, Vite, and Tailwind CSS.
          </p>
          <div className="pt-4 text-xs text-white/30 font-mono">
            Version 1.0.0
          </div>
        </section>

      </div>
    </Layout>
  );
}
