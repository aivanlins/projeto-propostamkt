import React from 'react';
import { 
  Building2, LayoutDashboard, Palette, ShieldCheck, 
  Server, Eye, Moon, Sun, Download, HardDrive, Plus, Sparkles 
} from 'lucide-react';
import { Proposta, ConfiguracaoFixa } from '../types';

export type ModoVisualizacao = 
  | 'cliente' 
  | 'admin' 
  | 'criar_proposta' 
  | 'editar_proposta' 
  | 'cms' 
  | 'agencia'
  | 'instalador' 
  | 'seguranca' 
  | 'cpanel';

interface NavbarProps {
  modoAtual: ModoVisualizacao;
  setModoAtual: (modo: ModoVisualizacao) => void;
  propostas: Proposta[];
  propostaSelecionada: Proposta;
  setPropostaSelecionada: (prop: Proposta) => void;
  config: ConfiguracaoFixa;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onNovaProposta: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  modoAtual,
  setModoAtual,
  propostas,
  propostaSelecionada,
  setPropostaSelecionada,
  config,
  darkMode,
  setDarkMode,
  onNovaProposta,
}) => {
  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* LOGO & NOME DA AGÊNCIA */}
          <div 
            onClick={() => setModoAtual('cliente')}
            className="flex items-center gap-3 shrink-0 cursor-pointer"
          >
            {config.logoUrl ? (
              <img 
                src={config.logoUrl} 
                alt={config.nomeAgencia} 
                className="w-9 h-9 rounded-xl object-contain shadow-md bg-zinc-100 dark:bg-zinc-800 p-0.5" 
              />
            ) : (
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md uppercase"
                style={{ backgroundColor: config.corPrimaria || '#4F46E5' }}
              >
                {config.nomeAgencia ? config.nomeAgencia.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() : 'AG'}
              </div>
            )}
            <div>
              <span className="font-extrabold text-zinc-900 dark:text-white tracking-tight text-sm sm:text-base block leading-none">
                {config.nomeAgencia || 'Minha Agência'}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                Gestão de Propostas
              </span>
            </div>
          </div>

          {/* MENU PRINCIPAL DE NAVEGAÇÃO ENTRE MÓDULOS */}
          <div className="hidden lg:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl">
            {[
              { id: 'cliente', label: 'Portal Cliente', icon: Eye },
              { id: 'admin', label: 'Dashboard & KPIs', icon: LayoutDashboard },
              { id: 'cms', label: 'CMS & Seções', icon: Palette },
              { id: 'agencia', label: 'Identidade & Agência', icon: Building2 },
              { id: 'instalador', label: 'Instalação (Setup)', icon: HardDrive },
              { id: 'seguranca', label: 'Auditoria SIEM', icon: ShieldCheck },
              { id: 'cpanel', label: 'Kit cPanel / PHP', icon: Server },
            ].map(item => {
              const Icon = item.icon;
              const ativo = modoAtual === item.id || 
                (item.id === 'admin' && (modoAtual === 'criar_proposta' || modoAtual === 'editar_proposta'));
              return (
                <button
                  key={item.id}
                  onClick={() => setModoAtual(item.id as ModoVisualizacao)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    ativo
                      ? 'bg-white dark:bg-zinc-900 text-purple-900 dark:text-purple-300 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* SELETOR RÁPIDO & AÇÕES */}
          <div className="flex items-center gap-2">
            
            {/* Seletor rápido de proposta */}
            <div className="relative">
              <select
                value={propostaSelecionada?.id}
                onChange={e => {
                  const encontrada = propostas.find(p => p.id === e.target.value);
                  if (encontrada) setPropostaSelecionada(encontrada);
                }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none max-w-[140px] sm:max-w-[190px] truncate"
                title="Selecione a proposta em exibição"
              >
                {propostas.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.status === 'ativo' ? '🟢' : p.status === 'expirado' ? '🔴' : '🟡'} {p.clienteEmpresa}
                  </option>
                ))}
              </select>
            </div>

            {/* BOTÃO CLARO E ESCURO (TOTALMENTE FUNCIONAL) */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
              title={darkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              aria-label="Alternar tema claro e escuro"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-700" />}
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO MOBILE */}
        <div className="flex lg:hidden items-center justify-between overflow-x-auto py-2 gap-1 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          {[
            { id: 'cliente', label: 'Cliente' },
            { id: 'admin', label: 'Dashboard' },
            { id: 'cms', label: 'CMS' },
            { id: 'agencia', label: 'Agência & Cores' },
            { id: 'instalador', label: 'Instalação' },
            { id: 'seguranca', label: 'Auditoria' },
            { id: 'cpanel', label: 'cPanel' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setModoAtual(item.id as ModoVisualizacao)}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer ${
                modoAtual === item.id
                  ? 'bg-purple-900 text-white'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
