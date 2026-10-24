import React, { useState } from 'react';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';

export const RedefinirSenhaPage: React.FC = () => {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (novaSenha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres.');
    if (novaSenha !== confirmar) return setErro('As senhas não conferem.');
    setEnviando(true);
    try {
      const res = await fetch('/api/auth/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.sucesso) throw new Error(data.erro || 'Não foi possível redefinir a senha.');
      setSucesso(true);
      setTimeout(() => { window.location.href = '/?senhaRedefinida=1'; }, 2500);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const input = 'w-full px-4 py-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-sm text-white outline-none focus:ring-2 focus:ring-purple-600';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-white">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full space-y-5">
        <div className="text-center space-y-1">
          <Lock className="w-8 h-8 mx-auto text-purple-500" />
          <h1 className="text-xl font-bold">Redefinir Senha</h1>
        </div>
        {!token ? (
          <p className="text-sm text-rose-400 text-center">Link inválido. Solicite uma nova recuperação de senha.</p>
        ) : sucesso ? (
          <div className="text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
            <p className="text-sm">Senha redefinida com sucesso! Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="password" placeholder="Nova senha" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} className={input} />
            <input type="password" placeholder="Confirmar senha" value={confirmar} onChange={e => setConfirmar(e.target.value)} className={input} />
            {erro && <p className="text-xs text-rose-400">{erro}</p>}
            <button disabled={enviando} className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {enviando && <Loader2 className="w-4 h-4 animate-spin" />} Salvar nova senha
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
