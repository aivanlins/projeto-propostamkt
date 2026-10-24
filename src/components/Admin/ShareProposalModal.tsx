import React, { useMemo, useState } from 'react';
import { X, Copy, Check, Mail, ExternalLink, MessageCircle, Code2, FileText, Info, Link2 } from 'lucide-react';
import { Proposta, ConfiguracaoFixa } from '../../types';
import { getUrlProposta } from '../../utils/propostaUrl';
import { gerarAssuntoEmail, gerarEmailHtml, gerarEmailTexto } from '../../utils/emailTemplate';

interface ShareProposalModalProps {
  proposta: Proposta;
  config: ConfiguracaoFixa;
  onFechar: () => void;
  onCompartilhado?: (proposta: Proposta, canal: string) => void;
}

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Fallback para navegadores sem Clipboard API (ex.: HTTP sem SSL)
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

export const ShareProposalModal: React.FC<ShareProposalModalProps> = ({ proposta, config, onFechar, onCompartilhado }) => {
  const url = getUrlProposta(proposta);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [abaEmail, setAbaEmail] = useState(false);

  const assunto = gerarAssuntoEmail(proposta, config);
  const textoEmail = useMemo(() => gerarEmailTexto(proposta, config, url), [proposta, config, url]);
  const htmlEmail = useMemo(() => gerarEmailHtml(proposta, config, url), [proposta, config, url]);

  const marcarCopiado = (chave: string) => {
    setCopiado(chave);
    setTimeout(() => setCopiado(null), 2500);
  };

  const handleCopiar = async (chave: string, texto: string) => {
    if (await copiarTexto(texto)) {
      marcarCopiado(chave);
      onCompartilhado?.(proposta, chave);
    }
  };

  const telefoneCliente = (proposta.clienteTelefone || '').replace(/\D/g, '');
  const mensagemWhats = `Olá, ${proposta.clienteNome || ''}! Segue a proposta comercial "${proposta.titulo}" preparada pela ${config?.nomeAgencia || 'nossa agência'} para ${proposta.clienteEmpresa || 'você'}:\n\n${url}`;
  const linkWhats = `https://wa.me/${telefoneCliente.length >= 10 ? telefoneCliente : ''}?text=${encodeURIComponent(mensagemWhats)}`;
  const linkMailto = `mailto:${encodeURIComponent(proposta.clienteEmail || '')}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(textoEmail)}`;

  const opcao = 'w-full flex items-center gap-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-left transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onFechar}>
      <div
        className={`bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full ${abaEmail ? 'max-w-3xl' : 'max-w-md'} max-h-[92vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white">Compartilhar Proposta</h3>
            <p className="text-xs text-zinc-500">{proposta.clienteEmpresa} • {proposta.titulo}</p>
          </div>
          <button onClick={onFechar} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* URL */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">Link da proposta</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 break-all">
                <Link2 className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                <span>{url}</span>
              </div>
              <button
                onClick={() => handleCopiar('url', url)}
                className="shrink-0 px-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                {copiado === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiado === 'url' ? 'Copiado!' : 'Copiar URL'}
              </button>
            </div>
            {!proposta.slug && (
              <p className="text-[11px] text-amber-600 mt-1">Esta proposta ainda não tem URL personalizada. Edite e salve a proposta para gerar o link amigável.</p>
            )}
          </div>

          {!abaEmail ? (
            <div className="space-y-2">
              <a href={linkWhats} target="_blank" rel="noopener noreferrer" className={opcao} onClick={() => onCompartilhado?.(proposta, 'whatsapp')}>
                <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600"><MessageCircle className="w-4 h-4" /></span>
                <span>
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white">WhatsApp</span>
                  <span className="block text-[11px] text-zinc-500">
                    {telefoneCliente.length >= 10 ? `Enviar para ${proposta.clienteTelefone}` : 'Escolher o contato no WhatsApp'}
                  </span>
                </span>
              </a>

              <button type="button" className={opcao} onClick={() => setAbaEmail(true)}>
                <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600"><Mail className="w-4 h-4" /></span>
                <span>
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white">E-mail</span>
                  <span className="block text-[11px] text-zinc-500">Modelo padrão com a identidade da agência</span>
                </span>
              </button>

              <button type="button" className={opcao} onClick={() => handleCopiar('url', url)}>
                <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600">
                  {copiado === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </span>
                <span>
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white">{copiado === 'url' ? 'URL copiada!' : 'Copiar URL'}</span>
                  <span className="block text-[11px] text-zinc-500">Copia o link para colar onde quiser</span>
                </span>
              </button>

              <a href={url} target="_blank" rel="noopener noreferrer" className={opcao}>
                <span className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"><ExternalLink className="w-4 h-4" /></span>
                <span>
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white">Abrir página</span>
                  <span className="block text-[11px] text-zinc-500">Abre a página do cliente em nova aba</span>
                </span>
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  O envio é feito pelo <strong>seu programa de e-mail</strong> (Outlook, Gmail etc.). "Abrir no meu e-mail" cria a mensagem em texto para
                  {' '}<strong>{proposta.clienteEmail || 'o cliente'}</strong>. Para o layout visual, use "Copiar HTML" e cole no editor do seu e-mail.
                  Dados da agência vêm de <em>Identidade &amp; Agência</em>.
                </span>
              </div>

              <div className="text-xs"><span className="font-bold text-zinc-500">Assunto:</span> {assunto}</div>

              <iframe
                title="Pré-visualização do e-mail"
                srcDoc={htmlEmail}
                sandbox=""
                className="w-full h-[420px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <a
                  href={linkMailto}
                  onClick={() => onCompartilhado?.(proposta, 'email')}
                  className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> Abrir no meu e-mail
                </a>
                <button
                  onClick={() => handleCopiar('html', htmlEmail)}
                  className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {copiado === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code2 className="w-3.5 h-3.5" />}
                  {copiado === 'html' ? 'HTML copiado!' : 'Copiar HTML'}
                </button>
                <button
                  onClick={() => handleCopiar('texto', `${assunto}\n\n${textoEmail}`)}
                  className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {copiado === 'texto' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5" />}
                  {copiado === 'texto' ? 'Texto copiado!' : 'Copiar texto'}
                </button>
              </div>

              <button onClick={() => setAbaEmail(false)} className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                ← Voltar às opções
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
