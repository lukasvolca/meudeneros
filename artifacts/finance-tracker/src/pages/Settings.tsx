import { useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { useFinance } from "@/context/FinanceContext";
import { useAuth } from "@/context/AuthContext";
import { Download, Upload, Trash2, Camera, Check, LogOut, Info, Shield, ScrollText, X, Sparkles, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CHANGELOG, APP_VERSION } from "@/lib/changelog";

export default function Settings() {
  const { clearAllData, transactions, categories, bills, initialBalance, addTransaction, addCategory } = useFinance();
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  const profile = (window as any)._userProfile || {};
  const [name, setName] = useState(profile.name || "");
  const [avatar, setAvatar] = useState<string | null>(profile.avatar || null);
  const [saving, setSaving] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [showChangelog, setShowChangelog] = useState(false);

  const handleSaveName = async () => {
    setSaving(true);
    const err = await (window as any)._saveProfile?.(name, undefined);
    setSaving(false);
    if (err) { toast({ title: "Erro ao salvar nome.", variant: "destructive" }); return; }
    toast({ title: "Nome atualizado!" });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 200; canvas.height = 200;
        const ctx = canvas.getContext("2d")!;
        const size = Math.min(img.width, img.height);
        const ox = (img.width - size) / 2;
        const oy = (img.height - size) / 2;
        ctx.drawImage(img, ox, oy, size, size, 0, 0, 200, 200);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setAvatar(dataUrl);
        const err = await (window as any)._saveProfile?.(name, dataUrl);
        toast(err ? { title: "Erro ao salvar foto.", variant: "destructive" } : { title: "Foto atualizada!" });
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleExport = () => {
    const data = { transactions, categories, bills, initialBalance, exportedAt: new Date().toISOString() };
    const url = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement("a");
    a.href = url; a.download = "meudeneros_backup.json";
    document.body.appendChild(a); a.click(); a.remove();
    toast({ title: "Exportação concluída", description: "Backup salvo como JSON." });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data.transactions) || !Array.isArray(data.categories)) throw new Error();
        const idMap: Record<string, string> = {};
        for (const cat of data.categories) {
          const newId = addCategory(cat.name, cat.icon, cat.type);
          idMap[cat.id] = newId;
        }
        for (const tx of data.transactions) {
          addTransaction({
            type: tx.type, amount: tx.amount, title: tx.title, date: tx.date,
            categoryId: idMap[tx.categoryId] || tx.categoryId,
            categoryName: tx.categoryName || "",
          });
        }
        toast({ title: "Importação concluída", description: `${data.transactions.length} transações importadas.` });
      } catch {
        toast({ title: "Arquivo JSON inválido.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClearData = () => {
    if (confirm("Tem certeza? Isso vai apagar todas as suas transações e categorias permanentemente.")) {
      clearAllData();
      toast({ title: "Dados apagados", variant: "destructive" });
    }
  };

  return (
    <Layout title="Configurações">
      <div className="max-w-3xl space-y-6">

        {/* Profile */}
        <section className="glass-panel p-8 rounded-3xl">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="relative flex-shrink-0">
                <div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-primary overflow-hidden cursor-pointer group"
                  onClick={() => avatarRef.current?.click()}
                >
                  {avatar ? (
                    <img src={avatar} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                      {(name || profile.email || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-xs text-muted-foreground">{profile.email}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="glass-input rounded-xl px-3 py-2 text-sm text-white w-48"
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Salvar
                  </button>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs text-muted-foreground">{transactions.length} transaç{transactions.length === 1 ? "ão" : "ões"}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{categories.length} categoria{categories.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-muted-foreground hover:text-white hover:border-white/20 hover:bg-white/5 transition-colors text-sm font-medium flex-shrink-0"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </section>

        {/* Data management */}
        <section className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-display font-bold">Gerenciamento de Dados</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-black/20 border border-white/5">
              <h4 className="font-semibold mb-2">Exportar Dados</h4>
              <p className="text-sm text-muted-foreground mb-4">Baixe um backup JSON com todas as transações e categorias.</p>
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium w-full justify-center">
                <Download className="w-4 h-4" /> Exportar JSON
              </button>
            </div>
            <div className="p-5 rounded-2xl bg-black/20 border border-white/5">
              <h4 className="font-semibold mb-2">Importar Dados</h4>
              <p className="text-sm text-muted-foreground mb-4">Restaure um backup JSON exportado anteriormente.</p>
              <button onClick={() => importRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium w-full justify-center">
                <Upload className="w-4 h-4" /> Importar JSON
              </button>
              <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </div>
            <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10">
              <h4 className="font-semibold text-destructive mb-2">Zona de Perigo</h4>
              <p className="text-sm text-destructive/70 mb-4">Apaga permanentemente todos os dados locais.</p>
              <button onClick={handleClearData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-colors text-sm font-medium w-full justify-center">
                <Trash2 className="w-4 h-4" /> Apagar Tudo
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="glass-panel p-8 rounded-3xl">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
            <Info className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-display font-bold">Sobre o Meu Deneros</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">App de controle financeiro desenvolvido pela Pombo Lab</p>
          <div className="pt-4 flex items-center gap-3">
            <span className="text-xs text-white/30 font-mono">Versão {APP_VERSION}</span>
            <button
              onClick={() => setShowChangelog(true)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <ScrollText className="w-3.5 h-3.5" /> Ler patch notes
            </button>
          </div>
        </section>

      </div>

      {showChangelog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowChangelog(false)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 p-6 pb-4 border-b border-white/5">
              <ScrollText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-display font-bold text-white">Patch notes</h3>
                <p className="text-xs text-muted-foreground">O que mudou em cada versão</p>
              </div>
              <button
                onClick={() => setShowChangelog(false)}
                aria-label="Fechar"
                className="p-2 -mr-2 -mt-2 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 pt-5 space-y-6">
              {CHANGELOG.map((release) => (
                <div key={release.version} className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-display font-bold text-white">Versão {release.version}</span>
                    {release.version === APP_VERSION && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-primary/20 text-primary font-semibold">
                        atual
                      </span>
                    )}
                    {release.date && (
                      <span className="text-[11px] text-muted-foreground ml-auto tabular-nums">
                        {release.date.split("-").reverse().join("/")}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2.5">
                    {release.changes.map((change, i) => (
                      <li key={i} className="flex gap-2.5">
                        {change.type === "feat" ? (
                          <Sparkles className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                        ) : (
                          <Wrench className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                        )}
                        <p className="text-xs text-muted-foreground leading-relaxed">{change.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
