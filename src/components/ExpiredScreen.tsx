import React from 'react';
import { AlertCircle, Clock, MessageSquare, ArrowLeft, RefreshCw, ShieldAlert } from 'lucide-react';
import { Proposta, ConfiguracaoFixa } from '../types';
import { formatarDataHora } from '../utils/security';

interface ExpiredScreenProps {
  proposta: Proposta;
  config: ConfiguracaoFixa;
  motivoBloqueio?: 'EXPIRADA' | 'INATIVA' | 'RECUSADA' | 'NAO_ENCONTRADA';
  onVoltarParaPainel?: () => void;
  onSimularAtivacao?: () => void;
}

export const ExpiredScreen: React.FC<ExpiredScreenProps> = ({
  proposta,
  config,
  motivoBloqueio = 'EXPIRADA',
  onVoltarParaPainel,
  onSimularAtivacao,
}) => {
  const isExp = motivoBloqueio === 'EXPIRADA';
  const isInativa = motivoBloqueio === 'INATIVA';

  // Link do WhatsApp com mensagem pré-formatada
  const mensagemWpp = encodeURIComponent(
    `Olá equipe da ${config.nomeAgencia}! Estava visualizando a proposta comercial "${proposta.titulo}" (ID: ${proposta.id}) para a empresa ${proposta.clienteEmpresa}, e notei que o link expirou em ${formatarDataHora(proposta.dataValidade)}. Gostaria de solicitar a renovação da validade ou uma proposta atualizada.`
  );
  const linkWhatsApp = `https://wa.me/${config.telefoneWhatsapp.replace(/\D/g, '')}?text=${mensagemWpp}`;

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-10 text-center relative overflow-hidden">
        {/* Glow de fundo */}
        <div 
          className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: config.corPrimaria }}
        />
        <div 
          className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: config.corSecundaria }}
        />

        {/* Ícone de Alerta */}
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-6 shadow-inner"
          style={{ 
            backgroundColor: isExp ? '#FEF3C7' : '#FEE2E2', 
            color: isExp ? '#D97706' : '#DC2626' 
          }}
        >
          {isExp ? (
            <Clock className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
          ) : (
            <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />
          )}
        </div>

        {/* Badge da Agência */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mb-3">
          {config.nomeAgencia} • Controle de Vigência
        </span>

        {/* Título Principal */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-3">
          {isExp ? 'Proposta Comercial Expirada' : 'Acesso Temporariamente Suspenso'}
        </h1>

        {/* Mensagem explicativa amigável */}
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
          {isExp ? (
            <>
              O prazo de validade desta proposta encerrou em{' '}
              <strong className="text-zinc-900 dark:text-zinc-200 font-semibold">
                {formatarDataHora(proposta.dataValidade)}
              </strong>
              . Para mantermos as condições especiais de investimento, disponibilidade de agenda e alocação da equipe técnica, nossas condições comerciais possuem vigência limitada.
            </>
          ) : isInativa ? (
            <>
              Este link foi desativado temporariamente pela equipe comercial da{' '}
              <strong className="text-zinc-900 dark:text-zinc-200">{config.nomeAgencia}</strong>{' '}
              para revisão ou atualização de termos.
            </>
          ) : (
            'O link acessado não está disponível no momento.'
          )}
        </p>

        {/* Card com Detalhes da Proposta */}
        <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-4 mb-8 text-left border border-zinc-200/80 dark:border-zinc-700/60">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Referência da Negociação
          </div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base line-clamp-1">
            {proposta.titulo}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Cliente: <strong className="text-zinc-700 dark:text-zinc-300">{proposta.clienteEmpresa}</strong></span>
            <span>Aos cuidados: <strong className="text-zinc-700 dark:text-zinc-300">{proposta.clienteNome}</strong></span>
          </div>
        </div>

        {/* Ações para o Cliente */}
        <div className="space-y-3">
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-white font-bold text-sm sm:text-base shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageSquare className="w-5 h-5" />
            Solicitar Reativação / Conversar no WhatsApp
          </a>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {onVoltarParaPainel && (
              <button
                onClick={onVoltarParaPainel}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Painel Administrativo
              </button>
            )}

            {onSimularAtivacao && (
              <button
                onClick={onSimularAtivacao}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
                title="Renova a data de validade para +7 dias para fins de teste no applet"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Renovar Validade (+7 Dias)
              </button>
            )}
          </div>
        </div>

        {/* Rodapé Seguro */}
        <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-2 text-xs text-zinc-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Protocolo de Segurança HTTP 410 (Resource Expired) • Validade Encerrada</span>
        </div>
      </div>
    </div>
  );
};
