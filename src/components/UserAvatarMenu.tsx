import React, { useEffect, useRef, useState } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Usuario } from '../types';

const CORES = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#4f46e5'];

export function iniciaisDoNome(nome: string): string {
  const partes = (nome || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0][0] || '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export function corDoNome(nome: string): string {
  let h = 0;
  for (const c of nome || '') h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CORES[h % CORES.length];
}

interface UserAvatarMenuProps {
  usuario: Usuario;
  onLogout: () => void;
  onAbrirPerfil: () => void;
}

export const UserAvatarMenu: React.FC<UserAvatarMenuProps> = ({ usuario, onLogout, onAbrirPerfil }) => {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const foto = (usuario as any)?.fotoUrl || (usuario as any)?.photoUrl || (usuario as any)?.avatarUrl;

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold ring-2 ring-zinc-200 dark:ring-zinc-700 hover:ring-purple-500 transition-all cursor-pointer"
        style={foto ? undefined : { backgroundColor: corDoNome(usuario?.nome || '') }}
        title={usuario?.nome}
        aria-label="Menu do usuário"
      >
        {foto ? <img src={foto} alt={usuario?.nome} className="w-full h-full object-cover" /> : iniciaisDoNome(usuario?.nome || '')}
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-2 z-50">
          <div className="px-4 py-2">
            <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">{usuario?.nome}</div>
            <div className="text-xs text-zinc-500 truncate">{usuario?.email}</div>
          </div>
          <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
          <button
            type="button"
            onClick={() => { setAberto(false); onAbrirPerfil(); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <UserIcon className="w-4 h-4" /> Meu Perfil
          </button>
          <button
            type="button"
            onClick={() => { setAberto(false); onLogout(); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      )}
    </div>
  );
};
