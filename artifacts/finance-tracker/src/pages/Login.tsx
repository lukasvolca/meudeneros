import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PiggyBank } from "lucide-react";

export default function Login() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await signInWithEmail(email.trim());
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-panel p-10 rounded-3xl max-w-md w-full flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <PiggyBank className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Meu Deneros</h1>
        </div>

        {sent ? (
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <span className="text-3xl">📧</span>
            </div>
            <h2 className="text-lg font-bold text-white">Verifique seu email</h2>
            <p className="text-muted-foreground text-sm">
              Enviamos um link de acesso para <span className="text-white font-medium">{email}</span>.
              Clique no link para entrar.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-sm text-primary hover:text-white transition-colors"
            >
              Usar outro email
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-bold text-white">Entrar</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Digite seu email para receber o link de acesso.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-center"
              />
              {error && (
                <p className="text-destructive text-xs">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar link de acesso"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
