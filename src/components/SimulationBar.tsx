import React from 'react';
import { 
  Zap, Clock, ShieldAlert, CheckCircle, RefreshCw, 
  UserCheck
} from 'lucide-react';
import { Proposta, Usuario } from '../types';

interface SimulationBarProps {
  propostaAtual: Proposta;
  onSelecionarPorStatus: (tipo: 'ativa' | 'expirada' | 'inativa' | 'aceita') => void;
  onExpirarImediatamente: () => void;
  onRenovarValidade: () => void;
  usuarioAtual: Usuario;
  usuarios: Usuario[];
  onTrocarUsuario: (usuario: Usuario) => void;
}

export const SimulationBar: React.FC<SimulationBarProps> = ({
  propostaAtual,
  onSelecionarPorStatus,
  onExpirarImediatamente,
  onRenovarValidade,
  usuarioAtual,
  usuarios,
  onTrocarUsuario,
}) => {
  return (
    <aside aria-label="Console de Teste Rápido de Segurança" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-5xl w-[95%] sm:w-auto bg-zinc-950/95 text-white backdrop-blur-md border border-zinc-800 rounded-2xl p-2.5 sm:px-4 sm:py-2.5 shadow-2xl flex flex-wrap items-center justify-between sm:justify-center gap-2 sm:gap-4 text-xs print:hidden animate-fade-in">
      
      {/* Título da Barra */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="font-bold text-zinc-300 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Simulação & Testes:
        </span>
      </div>

      {/* Botões de Simulação de Casos de Uso */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onSelecionarPorStatus('ativa')}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          title="Carregar proposta ativa e no prazo"
        >
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          Link Ativo
        </button>

        <button
          onClick={() => onSelecionarPorStatus('expirada')}
          className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-semibold transition-colors flex items-center gap-1 border border-amber-800/60 cursor-pointer"
          title="Testar tela de bloqueio com link expirado (HTTP 410)"
        >
          <Clock className="w-3 h-3 text-amber-400" />
          Link Expirado
        </button>

        <button
          onClick={() => onSelecionarPorStatus('inativa')}
          className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 font-semibold transition-colors flex items-center gap-1 border border-red-800/60 cursor-pointer"
          title="Testar tela de link suspenso manualmente (HTTP 403)"
        >
          <ShieldAlert className="w-3 h-3 text-red-400" />
          Link Desativado
        </button>

        <button
          onClick={onExpirarImediatamente}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors cursor-pointer"
          title="Altera a data de validade da proposta atual para o passado"
        >
          Expirar Agora
        </button>

        <button
          onClick={onRenovarValidade}
          className="px-2.5 py-1 rounded-lg bg-purple-900 hover:bg-purple-800 text-purple-200 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          title="Adiciona +7 dias de validade à proposta atual"
        >
          <RefreshCw className="w-3 h-3" />
          +7 Dias
        </button>
      </div>

      {/* Simulação e Troca de Usuário da Equipe */}
      <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-800">
        <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-zinc-400 text-[11px]">Usuário Ativo:</span>
        <select
          value={usuarioAtual.id}
          onChange={e => {
            const enc = usuarios.find(u => u.id === e.target.value);
            if (enc) onTrocarUsuario(enc);
          }}
          className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded px-2 py-0.5 text-[11px] font-semibold focus:outline-none"
        >
          {usuarios.map(u => (
            <option key={u.id} value={u.id}>
              {u.nome} ({u.papel === 'admin' ? 'Admin' : 'Comercial'})
            </option>
          ))}
        </select>
      </div>

    </aside>
  );
};
