import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Lock, Unlock, Save, X, Users } from 'lucide-react';
import { Usuario } from '../../types';
import { slugify } from '../../utils/propostaUrl';
import { maskPhone } from '../../utils/masks';

interface TeamManagementPageProps {
  usuarios: Usuario[];
  usuarioAtual: Usuario;
  onSalvarUsuario: (usuario: Usuario) => void;
  onAlternarStatusUsuario: (id: string, novoStatus: 'ativo' | 'bloqueado') => void;
  onExcluirUsuario: (id: string) => void;
}

const iniciais = (nome: string) =>
  (nome || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

const novoUsuarioVazio = (): Usuario => ({
  id: `usr_${Date.now()}`,
  nome: '',
  email: '',
  whatsapp: '',
  cargo: '',
  slug: '',
  papel: 'comercial' as Usuario['papel'],
  status: 'ativo',
  podeCriarSecoes: false,
} as Usuario);

const campo = 'w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-purple-600';

export const TeamManagementPage: React.FC<TeamManagementPageProps> = ({
  usuarios, usuarioAtual, onSalvarUsuario, onAlternarStatusUsuario, onExcluirUsuario,
}) => {
  const isAdmin = usuarioAtual.papel === 'admin';
  const [emEdicao, setEmEdicao] = useState<Usuario | null>(null);
  const [isNovo, setIsNovo] = useState(false);
  const [senha, setSenha] = useState('');

  const abrir = (u: Usuario | null) => {
    setIsNovo(!u);
    setEmEdicao(u ? { ...u } : novoUsuarioVazio());
    setSenha('');
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emEdicao) return;
    if (!emEdicao.nome.trim() || !emEdicao.email.trim()) {
      window.alert('Preencha nome e e-mail.');
      return;
    }
    if (isNovo && senha.length < 6) {
      window.alert('Defina uma senha com pelo menos 6 caracteres.');
      return;
    }
    const final: Usuario = {
      ...emEdicao,
      slug: emEdicao.slug || slugify(emEdicao.nome),
      ...(senha ? { senha } : {}),
    };
    onSalvarUsuario(final);
    setEmEdicao(null);
  };

  const excluir = (u: Usuario) => {
    if (u.id === usuarioAtual.id) {
      window.alert('Você não pode excluir o seu próprio usuário.');
      return;
    }
    if (window.confirm(`Confirma a exclusão do usuário "${u.nome}"? Esta ação não pode ser desfeita.`)) {
      onExcluirUsuario(u.id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-purple-600"><Users className="w-5 h-5" /></span>
          <div>
            <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">Equipe Comercial</h1>
            <p className="text-xs text-zinc-500">{usuarios.length} usuário(s) cadastrado(s)</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => abrir(null)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold">
            <Plus className="w-4 h-4" /> Novo Usuário
          </button>
        )}
      </div>

      {emEdicao && (
        <form onSubmit={salvar} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-zinc-900 dark:text-white">{isNovo ? 'Novo Usuário' : `Editar: ${emEdicao.nome}`}</h2>
            <button type="button" onClick={() => setEmEdicao(null)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Cancelar"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-xs font-bold text-zinc-500">Nome *<input className={campo} value={emEdicao.nome} onChange={e => setEmEdicao({ ...emEdicao, nome: e.target.value })} /></label>
            <label className="text-xs font-bold text-zinc-500">E-mail *<input type="email" className={campo} value={emEdicao.email} onChange={e => setEmEdicao({ ...emEdicao, email: e.target.value })} /></label>
            <label className="text-xs font-bold text-zinc-500">WhatsApp<input className={campo} value={emEdicao.whatsapp || ''} maxLength={19} onChange={e => setEmEdicao({ ...emEdicao, whatsapp: maskPhone(e.target.value) })} placeholder="+55 11 99999-9999" /></label>
            <label className="text-xs font-bold text-zinc-500">Cargo<input className={campo} value={emEdicao.cargo || ''} onChange={e => setEmEdicao({ ...emEdicao, cargo: e.target.value })} /></label>
            <label className="text-xs font-bold text-zinc-500">Perfil
              <select className={campo} value={emEdicao.papel} disabled={!isAdmin} onChange={e => setEmEdicao({ ...emEdicao, papel: e.target.value as Usuario['papel'] })}>
                <option value="admin">Administrador</option>
                <option value="comercial">Comercial</option>
              </select>
            </label>
            <label className="text-xs font-bold text-zinc-500">{isNovo ? 'Senha *' : 'Nova senha (deixe em branco para manter)'}
              <input type="password" className={campo} value={senha} onChange={e => setSenha(e.target.value)} autoComplete="new-password" />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEmEdicao(null)} className="px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold">Cancelar</button>
            <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"><Save className="w-4 h-4" /> Salvar</button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-[11px] uppercase text-zinc-500">
            <tr>
              <th className="px-5 py-3 text-left">Usuário</th>
              <th className="px-5 py-3 text-left">E-mail</th>
              <th className="px-5 py-3 text-left">Perfil</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {usuarios.map(u => {
              const podeEditar = isAdmin || u.id === usuarioAtual.id;
              return (
                <tr key={u.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {u.fotoUrl ? (
                        <img src={u.fotoUrl} alt={u.nome} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <span className="w-9 h-9 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">{iniciais(u.nome)}</span>
                      )}
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-white block">{u.nome}</span>
                        <span className="text-[11px] text-zinc-400">{u.cargo}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800">{u.papel === 'admin' ? 'Administrador' : 'Comercial'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${u.status === 'ativo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'}`}>
                      {u.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      {podeEditar && (
                        <button onClick={() => abrir(u)} className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-blue-600" title="Editar"><Edit3 className="w-3.5 h-3.5" /></button>
                      )}
                      {isAdmin && u.id !== usuarioAtual.id && (
                        <>
                          <button
                            onClick={() => onAlternarStatusUsuario(u.id, u.status === 'ativo' ? 'bloqueado' : 'ativo')}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-amber-600"
                            title={u.status === 'ativo' ? 'Bloquear' : 'Desbloquear'}
                          >
                            {u.status === 'ativo' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => excluir(u)} className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-red-600" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
