import React, { useState } from 'react';
import { 
  Mail, Send, CheckCircle2, AlertCircle, X, ShieldCheck, 
  ExternalLink, Server, Clock, Sparkles 
} from 'lucide-react';
import { Proposta, ConfiguracaoFixa } from '../../types';
import { formatarDataHora } from '../../utils/security';
import { getUrlProposta } from '../../utils/propostaUrl';

interface EmailSimulatorModalProps {
  proposta: Proposta;
  config: ConfiguracaoFixa;
  onFechar: () => void;
  onConfirmarEnvio: (emailDestino: string, assunto: string, corpo: string) => void;
}

export const EmailSimulatorModal: React.FC<EmailSimulatorModalProps> = ({
  proposta,
  config,
  onFechar,
  onConfirmarEnvio,
}) => {
  const [destinatarioNome, setDestinatarioNome] = useState(proposta.clienteNome);
  const [destinatarioEmail, setDestinatarioEmail] = useState(proposta.clienteEmail);
  const [assunto, setAssunto] = useState(
    `${config?.nomeAgencia || 'Proposta Comercial'} • Proposta Comercial "${proposta.titulo}" está pronta!`
  );
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState(
    `Olá, ${proposta.clienteNome}! É um prazer apresentar o planejamento estratégico desenvolvido exclusivamente para a ${proposta.clienteEmpresa}.\n\nNossa proposta detalha todas as entregas, cronograma de execução e condições comerciais com vigência regulamentada.`
  );

  const [statusEnvio, setStatusEnvio] = useState<'ocioso' | 'enviando' | 'sucesso'>('ocioso');
  const [etapaTexto, setEtapaTexto] = useState('');

  const linkProposta = getUrlProposta(proposta);

  const handleDispararEnvio = () => {
    setStatusEnvio('enviando');
    const dominio = config.emailContato?.split('@')[1] || 'suaagencia.com.br';
    setEtapaTexto(`Conectando ao servidor SMTP cPanel (ssl://mail.${dominio}:465)...`);

    setTimeout(() => {
      setEtapaTexto('Assinando chaves criptográficas DKIM, SPF e DMARC corporativo...');
      setTimeout(() => {
        setEtapaTexto('Transmitindo mensagem multipart/alternative via TLS 1.3...');
        setTimeout(() => {
          setStatusEnvio('sucesso');
          onConfirmarEnvio(destinatarioEmail, assunto, mensagemPersonalizada);
        }, 800);
      }, 700);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8 relative">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: config.corPrimaria }}
            >
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                Simulador de Envio de E-mail Corporativo
              </h3>
              <p className="text-xs text-zinc-500">
                Disparo transacional seguro com link público e token de acesso
              </p>
            </div>
          </div>

          <button
            onClick={onFechar}
            className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusEnvio === 'sucesso' ? (
          <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-black text-zinc-900 dark:text-white">
              E-mail Entregue com Sucesso!
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              A notificação foi despachada para <strong className="text-zinc-900 dark:text-zinc-200">{destinatarioEmail}</strong> com o link autenticado da proposta e registrado na auditoria.
            </p>

            <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-left text-xs font-mono space-y-1 text-zinc-600 dark:text-zinc-300">
              <div>STATUS: 250 2.0.0 OK: message queued 10984128</div>
              <div>REMETENTE: {config.emailContato || 'contato@suaagencia.com.br'}</div>
              <div>AUTENTICAÇÃO: DKIM=pass (2048-bit) SPF=pass</div>
              <div>VALIDADE INDICADA: {formatarDataHora(proposta.dataValidade)}</div>
            </div>

            <button
              onClick={onFechar}
              className="px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-sm hover:opacity-90"
            >
              Fechar Janela
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Campos de Destinatário */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome do Destinatário
                </label>
                <input
                  type="text"
                  value={destinatarioNome}
                  onChange={e => setDestinatarioNome(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  E-mail do Cliente
                </label>
                <input
                  type="email"
                  value={destinatarioEmail}
                  onChange={e => setDestinatarioEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                Assunto do E-mail
              </label>
              <input
                type="text"
                value={assunto}
                onChange={e => setAssunto(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                Mensagem Introdutória
              </label>
              <textarea
                rows={3}
                value={mensagemPersonalizada}
                onChange={e => setMensagemPersonalizada(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs leading-relaxed"
              />
            </div>

            {/* PREVIEW DO TEMPLATE DE E-MAIL HTML */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
              <span className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Pré-visualização do Layout do E-mail Recebido
              </span>

              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="font-black text-sm text-zinc-900 dark:text-white" style={{ color: config.corPrimaria }}>
                    {config.nomeAgencia}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">2026</span>
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                  {mensagemPersonalizada}
                </p>

                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-purple-900 dark:text-purple-200">
                      {proposta.titulo}
                    </div>
                    <div className="text-[11px] text-purple-700 dark:text-purple-400">
                      Validade: {formatarDataHora(proposta.dataValidade)}
                    </div>
                  </div>

                  <span 
                    className="px-3 py-1.5 rounded-lg text-white font-bold text-xs shadow-xs"
                    style={{ backgroundColor: config.corPrimaria }}
                  >
                    Acessar Proposta
                  </span>
                </div>

                <div className="text-[10px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  {config.nomeAgencia || 'Agência'} • {config.telefoneWhatsapp || config.emailContato}
                </div>
              </div>
            </div>

            {/* STATUS DO DISPARO EM TEMPO REAL */}
            {statusEnvio === 'enviando' && (
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-200 flex items-center gap-2 animate-pulse font-mono">
                <Server className="w-4 h-4 shrink-0 animate-spin" />
                <span>{etapaTexto}</span>
              </div>
            )}

            {/* AÇÕES */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onFechar}
                disabled={statusEnvio === 'enviando'}
                className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDispararEnvio}
                disabled={statusEnvio === 'enviando'}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg hover:opacity-95 transition-all disabled:opacity-50"
                style={{ backgroundColor: config.corPrimaria }}
              >
                <Send className="w-4 h-4" />
                {statusEnvio === 'enviando' ? 'Enviando...' : 'Disparar Notificação por E-mail'}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
