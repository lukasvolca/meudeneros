import { Layout } from "@/components/Layout";
import { useFinance } from "@/context/FinanceContext";
import { Download, Trash2, User, Shield, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { clearAllData, transactions, categories } = useFinance();
  const { toast } = useToast();

  const handleClearData = () => {
    if (confirm("Tem certeza? Isso vai apagar todas as suas transações e categorias permanentemente.")) {
      clearAllData();
      toast({
        title: "Dados apagados",
        description: "Todos os dados locais foram removidos.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const data = { transactions, categories, exportedAt: new Date().toISOString() };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", "fintrack_backup.json");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    toast({
      title: "Exportação concluída",
      description: "Seus dados foram baixados como JSON.",
    });
  };

  return (
    <Layout title="Configurações">
      <div className="max-w-3xl space-y-6">

        <section className="glass-panel p-8 rounded-3xl">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-primary p-[2px] flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                <User className="w-7 h-7 text-white/50" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-display font-bold">Usuário Local</h3>
              <p className="text-muted-foreground text-sm mt-1">Seus dados são armazenados localmente neste dispositivo.</p>
              <div className="flex gap-3 mt-1">
                <span className="text-xs text-muted-foreground">{transactions.length} transaç{transactions.length === 1 ? 'ão' : 'ões'}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{categories.length} categoria{categories.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-display font-bold">Gerenciamento de Dados</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-black/20 border border-white/5">
              <h4 className="font-semibold mb-2">Exportar Dados</h4>
              <p className="text-sm text-muted-foreground mb-4">Baixe um backup JSON com todas as suas transações e categorias.</p>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium w-full justify-center"
              >
                <Download className="w-4 h-4" /> Exportar JSON
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10">
              <h4 className="font-semibold text-destructive mb-2">Zona de Perigo</h4>
              <p className="text-sm text-destructive/70 mb-4">Apaga permanentemente todos os dados locais.</p>
              <button
                onClick={handleClearData}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-colors text-sm font-medium w-full justify-center"
              >
                <Trash2 className="w-4 h-4" /> Apagar Tudo
              </button>
            </div>
          </div>
        </section>

        <section className="glass-panel p-8 rounded-3xl">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
            <Info className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-display font-bold">Sobre o Meu Deneros</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">Meu Deneros é um controle financeiro pessoal premium, com foco em privacidade. Todos os dados ficam exclusivamente no seu navegador, sem servidores externos. Desenvolvido com React, Vite e Tailwind CSS.</p>
          <div className="pt-4 text-xs text-white/30 font-mono">
            Versão 1.0.0
          </div>
        </section>

      </div>
    </Layout>
  );
}
