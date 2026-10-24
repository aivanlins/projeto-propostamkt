import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2, Lock, 
  FileCode, Terminal, RefreshCw, KeyRound, Globe, Filter
} from 'lucide-react';
import { LogAuditoria } from '../../types';
import { formatarDataHora } from '../../utils/security';

interface SecurityLogsProps {
  logs: LogAuditoria[];
  onLimparLogs?: () => void;
  onSimularAtaque?: () => void;
}

export const SecurityLogs: React.FC<SecurityLogsProps> = ({
  logs,
  onLimparLogs,
  onSimularAtaque,
}) => {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  const logsFiltrados = logs.filter(log => {
    if (filtroStatus === 'todos') return true;
    return log.statusSeguranca === filtroStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO DE AUDITORIA */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              Monitor de Segurança & Auditoria (SIEM)
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Logs criptográficos de visualização, checagem cronológica de expiração de links, tokens CSRF e tentativas de acesso.
          </p>
        </div>

        {onSimularAtaque && (
          <button
            onClick={onSimularAtaque}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold hover:bg-red-100 transition-colors"
            title="Simula uma tentativa de invasão ou token forjado para testar o bloqueio preventivo"
          >
            <ShieldAlert className="w-4 h-4" />
            Simular Tentativa Forjada
          </button>
        )}
      </div>

      {/* PAINEL DE DEFESAS OWASP IMPLEMENTADAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* SQL Injection */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
              SQL Injection (OWASP A03)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm font-bold text-zinc-900 dark:text-white">
            PDO Prepared Statements
          </div>
          <p className="text-[11px] text-zinc-500 leading-tight">
            Emulação de prepares desativada (<code className="font-mono text-[10px]">EMULATE_PREPARES = false</code>). Consultas compiladas nativamente.
          </p>
        </div>

        {/* XSS Prevention */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
              Cross-Site Scripting (OWASP A07)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm font-bold text-zinc-900 dark:text-white">
            Output Escaping & CSP
          </div>
          <p className="text-[11px] text-zinc-500 leading-tight">
            Sanitização com <code className="font-mono text-[10px]">htmlspecialchars(ENT_QUOTES)</code> e headers estritos de Content-Security-Policy.
          </p>
        </div>

        {/* Anti-CSRF */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
              CSRF Defense (OWASP A01)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm font-bold text-zinc-900 dark:text-white">
            Tokens Criptográficos 256 bits
          </div>
          <p className="text-[11px] text-zinc-500 leading-tight">
            Comparação imune a Timing Attacks com <code className="font-mono text-[10px]">hash_equals()</code> e cookies SameSite=Strict.
          </p>
        </div>

        {/* Validação de Arquivos */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
              Malware & File Uploads
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm font-bold text-zinc-900 dark:text-white">
            Magic Bytes & MIME Whitelist
          </div>
          <p className="text-[11px] text-zinc-500 leading-tight">
            Inspeção via <code className="font-mono text-[10px]">finfo_file</code>, renomeação randômica e bloqueio de execução de scripts (.php).
          </p>
        </div>
      </div>

      {/* FILTROS DA TABELA DE LOGS */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-bold uppercase text-zinc-500">Filtrar por Status:</span>
          <div className="flex gap-1.5">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'OK', label: 'Sucesso (OK)' },
              { id: 'ALERTA', label: 'Alertas' },
              { id: 'BLOQUEIO', label: 'Bloqueios Preventivos' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFiltroStatus(f.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filtroStatus === f.id
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {onLimparLogs && (
          <button
            onClick={onLimparLogs}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Limpar Registros Antigos
          </button>
        )}
      </div>

      {/* TABELA DE AUDITORIA */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-xs uppercase font-bold text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-5 py-3.5">Data / Hora</th>
                <th className="px-5 py-3.5">Evento / Ação</th>
                <th className="px-5 py-3.5">Proposta / Referência</th>
                <th className="px-5 py-3.5">Origem (IP & Agente)</th>
                <th className="px-5 py-3.5">Nível</th>
                <th className="px-5 py-3.5">Detalhes da Auditoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-zinc-400">
                    Nenhum log registrado para este filtro.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map(log => (
                  <tr key={log.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-5 py-3 font-mono text-zinc-500 whitespace-nowrap">
                      {formatarDataHora(log.dataHora)}
                    </td>
                    <td className="px-5 py-3 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {log.acao}
                    </td>
                    <td className="px-5 py-3 font-medium text-zinc-700 dark:text-zinc-300 max-w-xs truncate">
                      {log.propostaTitulo || 'Geral do Sistema'}
                    </td>
                    <td className="px-5 py-3 font-mono text-zinc-500 whitespace-nowrap">
                      <div>IP: {log.ip}</div>
                      <div className="text-[10px] text-zinc-400 truncate max-w-[150px]">{log.usuarioNome}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        log.statusSeguranca === 'OK' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                        log.statusSeguranca === 'ALERTA' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                        'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                      }`}>
                        {log.statusSeguranca}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300 max-w-md">
                      {log.detalhes}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
