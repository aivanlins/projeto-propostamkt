import React, { useEffect, useState } from 'react';
import { Lock, Mail, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, senha: string) => Promise<{ success: boolean; error?: string; reinstalar?: boolean }>;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [esqueceuAberto, setEsqueceuAberto] = useState(false);
  const [agencia, setAgencia] = useState<{ logoUrl?: string; nomeAgencia?: string; corPrimaria?: string }>({});

  // Logo dinâmica: busca a identidade da agência no endpoint público /api/config
  useEffect(() => {
    fetch('/api/config')
      .then(res => (res.ok && (res.headers.get('content-type') || '').includes('application/json') ? res.json() : null))
      .then(data => { if (data) setAgencia(data); })
      .catch(() => {});
  }, []);

  const iniciaisAgencia = (agencia.nomeAgencia || 'Agência')
    .trim().split(/\s+/).filter(Boolean)
    .map((p, i, arr) => (i === 0 || i === arr.length - 1 ? p[0] : ''))
    .join('').substring(0, 2).toUpperCase();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !senha) {
      setErro('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const res = await onLogin(email, senha);
      if (!res.success) {
        setErro(res.error || 'Credenciais inválidas.');
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao comunicar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
      <div className="bg-zinc-900 p-8 sm:p-10 rounded-3xl w-full max-w-md shadow-2xl border border-zinc-800">
        
        {/* LOGO */}
        <div className="text-center mb-6">
          {agencia.logoUrl ? (
            <img
              src={agencia.logoUrl}
              alt={agencia.nomeAgencia || 'Logo da agência'}
              className="h-14 max-w-[180px] object-contain mx-auto mb-3"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg mb-3"
              style={{ backgroundColor: agencia.corPrimaria || '#6d28d9' }}
            >
              {iniciaisAgencia}
            </div>
          )}
          <h2 className="text-2xl font-black text-white tracking-tight">Login Administrativo</h2>
          <p className="text-xs text-zinc-400 mt-1">Acesso exclusivo para administradores e equipe</p>
        </div>

        {/* MENSAGEM DE ERRO */}
        {erro && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div>{erro}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full py-3 px-4 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm mt-3 flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer active:scale-98"
          >
            {carregando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <button
            type="button"
            onClick={() => setEsqueceuAberto(true)}
            className="hover:text-purple-400 transition-colors cursor-pointer"
          >
            Esqueceu a senha?
          </button>

        </div>

      </div>

      {/* MODAL ESQUECEU A SENHA */}
      {esqueceuAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-sm w-full space-y-4 text-center">
            <h3 className="text-lg font-bold text-white">Recuperação de Acesso</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Por motivos de segurança e proteção dos dados de clientes, redefinições de senha do Super Admin são feitas diretamente no banco de dados MySQL via phpMyAdmin. Fale com o administrador do sistema.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEsqueceuAberto(false)}
                className="flex-1 py-2 px-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold"
              >
                Fechar
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
