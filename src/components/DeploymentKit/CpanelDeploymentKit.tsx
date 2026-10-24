import React, { useState } from 'react';
import { 
  Database, FileCode, Shield, Server, Copy, Check, Download, 
  ExternalLink, Layers, CheckCircle, Terminal, HelpCircle 
} from 'lucide-react';
import { 
  SQL_SCHEMA_CONTENT, 
  PHP_CONTROLLER_CONTENT, 
  PHP_SECURITY_CONTENT, 
  PHP_DATABASE_CONTENT, 
  HTACCESS_CONTENT 
} from '../../cpanel-kit/codeFiles';

export const CpanelDeploymentKit: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState<'sql' | 'controller' | 'security' | 'database' | 'htaccess' | 'guia'>('sql');
  const [copiado, setCopiado] = useState(false);

  const obterCodigoAtual = () => {
    switch (abaAtiva) {
      case 'sql': return SQL_SCHEMA_CONTENT;
      case 'controller': return PHP_CONTROLLER_CONTENT;
      case 'security': return PHP_SECURITY_CONTENT;
      case 'database': return PHP_DATABASE_CONTENT;
      case 'htaccess': return HTACCESS_CONTENT;
      default: return SQL_SCHEMA_CONTENT;
    }
  };

  const obterNomeArquivo = () => {
    switch (abaAtiva) {
      case 'sql': return 'schema_propostas.sql';
      case 'controller': return 'PropostaController.php';
      case 'security': return 'Security.php';
      case 'database': return 'Database.php';
      case 'htaccess': return '.htaccess';
      default: return 'codigo.txt';
    }
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(obterCodigoAtual());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleBaixarArquivo = () => {
    const conteudo = obterCodigoAtual();
    const nomeArquivo = obterNomeArquivo();
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              <Server className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              Kit de Deploy cPanel • PHP & MySQL
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Estrutura ideal de banco de dados, lógica blindada em PHP com PDO Prepared Statements e checagem de expiração de links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopiar}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
          >
            {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copiado ? 'Copiado!' : 'Copiar Código'}
          </button>

          <button
            onClick={handleBaixarArquivo}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-900 text-white text-xs font-bold shadow-md hover:bg-purple-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar {obterNomeArquivo()}
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO ENTRE OS ARQUIVOS DO PROJETO */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        {[
          { id: 'sql', label: '1. Banco MySQL (schema.sql)', icon: Database },
          { id: 'controller', label: '2. Expiração de URL (PropostaController.php)', icon: FileCode },
          { id: 'security', label: '3. Núcleo de Segurança (Security.php)', icon: Shield },
          { id: 'database', label: '4. Conexão PDO (Database.php)', icon: Server },
          { id: 'htaccess', label: '5. Apache & Headers (.htaccess)', icon: Layers },
          { id: 'guia', label: '6. Guia de Implantação cPanel', icon: HelpCircle },
        ].map(aba => {
          const Icon = aba.icon;
          const ativo = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id as any)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                ativo
                  ? 'bg-purple-950 text-purple-200 shadow-sm border border-purple-800'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {aba.label}
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DA ABA SELECIONADA */}
      {abaAtiva === 'guia' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Manual de Instalação e Configuração no cPanel / Node.js
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                Importação do Banco no phpMyAdmin
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Acesse o cPanel &gt; Assistente de Banco de Dados MySQL. Crie o banco de dados e o usuário com permissões completas. Em seguida, utilize o instalador web do sistema ou o phpMyAdmin para importar a estrutura.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                Organização Segura de Pastas
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Recomenda-se manter as pastas <code className="font-mono">config/</code> e <code className="font-mono">classes/</code> um nível acima de <code className="font-mono">public_html/</code>, garantindo que arquivos com credenciais nunca sejam acessíveis diretamente via navegador.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                Validação de Expiração no Acesso
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                A validação de data_validade ocorre <strong>Just-In-Time</strong>: a cada requisição de URL, o controller confere se <code className="font-mono">NOW() &gt; data_validade</code>. Não depende obrigatoriamente de Cron Jobs, mas suporta cron para limpeza de logs antigos.
              </p>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/40 p-5 rounded-xl border border-purple-200 dark:border-purple-800/60">
            <h4 className="font-bold text-purple-900 dark:text-purple-200 text-sm mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              Diretrizes de Segurança para o Ambiente cPanel
            </h4>
            <ul className="text-xs text-purple-800 dark:text-purple-300 space-y-1.5 list-disc list-inside">
              <li>PHP 8.2 ou superior com extensões PDO, pdo_mysql e fileinfo ativas.</li>
              <li>Ative o mod_rewrite e mod_headers no Apache para os cabeçalhos de proteção (HSTS, CSP, X-Frame-Options).</li>
              <li>Certificado SSL Let's Encrypt / AutoSSL ativado com redirecionamento HTTPS forçado.</li>
              <li>Limite de memória de pelo menos 128MB e permissões de pasta 755 e arquivos 644.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
          {/* Barra do Arquivo */}
          <div className="bg-zinc-900/90 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-zinc-300 font-semibold">{obterNomeArquivo()}</span>
            </div>
            <span>Codificação UTF-8 • Strict Types</span>
          </div>

          {/* Visualizador de Código com Scroll Horizontal */}
          <pre className="p-5 text-xs sm:text-sm font-mono text-zinc-200 overflow-x-auto max-h-[600px] leading-relaxed selection:bg-purple-600 selection:text-white">
            {obterCodigoAtual()}
          </pre>
        </div>
      )}

    </div>
  );
};
