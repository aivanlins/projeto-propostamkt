import { maskPhone } from '../../utils/masks';
import React, { useState } from 'react';
import { 
  ArrowLeft, Save, Plus, Trash2, Clock, Check, Sparkles, 
  Building2, User, Mail, Phone, Instagram, Layers, DollarSign, 
  HelpCircle, Eye, ShieldCheck, CheckCircle2, FileText, X,
  Upload, RotateCcw, AlertTriangle, GripVertical, ArrowUp, ArrowDown,
  EyeOff, Sliders, Briefcase, ChevronRight
} from 'lucide-react';
import { z } from 'zod';
import { 
  Proposta, 
  StatusProposta, 
  ItemEntregavel, 
  ConfiguracaoFixa, 
  SecaoConfiguravel, 
  Usuario, 
  ServicoCustomizado,
  PopupFeedback 
} from '../../types';
import { 
  formatarMoeda, 
  gerarTokenSeguro, 
  sanitizarTexto,
  validarUploadImagem 
} from '../../utils/security';
import { slugify, gerarSlugUnico, getBaseUrlApp, PREFIXO_URL_PROPOSTA } from '../../utils/propostaUrl';
import { FeedbackPopup } from '../Common/FeedbackPopup';

interface ProposalFormPageProps {
  propostaInicial?: Proposta | null;
  config: ConfiguracaoFixa;
  usuarioAtual: Usuario;
  onSalvar: (proposta: Proposta) => void;
  onVoltar: () => void;
  /** Usado para garantir que a URL personalizada (slug) seja única. */
  propostasExistentes?: Proposta[];
}

// ZOD SCHEMA PARA VALIDAÇÃO DA PROPOSTA
const propostaZodSchema = z.object({
  titulo: z.string().min(3, 'O título da proposta deve ter no mínimo 3 caracteres.'),
  clienteNome: z.string().min(2, 'O nome do cliente responsável é obrigatório.'),
  clienteEmpresa: z.string().min(2, 'O nome da empresa cliente é obrigatório.'),
  clienteEmail: z.string().email('Insira um e-mail corporativo válido para o cliente.'),
  clienteTelefone: z.string().min(8, 'Telefone ou WhatsApp do cliente é obrigatório.'),
  precoDe: z.number().positive('O valor original (De) deve ser maior que zero.'),
  precoPor: z.number().positive('O valor de fechamento (POR) deve ser maior que zero.'),
  diasValidade: z.number().min(1, 'A vigência deve ser de pelo menos 1 dia.'),
});

export const ProposalFormPage: React.FC<ProposalFormPageProps> = ({
  propostaInicial,
  config,
  usuarioAtual,
  onSalvar,
  onVoltar,
  propostasExistentes = [],
}) => {
  const isEdicao = !!propostaInicial;

  // Estados dos campos do cliente
  const [titulo, setTitulo] = useState(propostaInicial?.titulo || 'Posicionamento Estratégico & Gestão de Performance');
  const [clienteNome, setClienteNome] = useState(propostaInicial?.clienteNome || '');
  const [clienteEmpresa, setClienteEmpresa] = useState(propostaInicial?.clienteEmpresa || '');
  const [clienteEmail, setClienteEmail] = useState(propostaInicial?.clienteEmail || '');
  const [clienteTelefone, setClienteTelefone] = useState(propostaInicial?.clienteTelefone || '+55 12 9');
  const [clienteDocumento, setClienteDocumento] = useState(propostaInicial?.clienteDocumento || '');
  const [clienteSegmento, setClienteSegmento] = useState(propostaInicial?.clienteSegmento || 'Saúde / Odontologia');
  const [clienteInstagram, setClienteInstagram] = useState(propostaInicial?.clienteInstagram || '@');

  // URL personalizada (/proposta-<slug>): gerada automaticamente até o usuário editar manualmente
  const [slugEditadoManual, setSlugEditadoManual] = useState(!!propostaInicial?.slug);
  const [slugDigitado, setSlugDigitado] = useState(propostaInicial?.slug || '');
  const slugBase = slugEditadoManual ? slugDigitado : (clienteEmpresa || clienteNome);
  const slugFinal = gerarSlugUnico(slugBase, propostasExistentes, propostaInicial?.id);
  const slugEmConflito = slugEditadoManual && !!slugify(slugDigitado) && slugFinal !== slugify(slugDigitado);

  // Lâmina Projeto
  const [projetoTexto, setProjetoTexto] = useState(
    propostaInicial?.projetoTexto ||
      `Construir um posicionamento estratégico para ${propostaInicial?.clienteEmpresa || 'sua empresa'} nas redes sociais, fortalecendo sua autoridade, credibilidade e percepção de valor no mercado.\n\nA estratégia terá como foco atrair o público certo, gerar confiança antes do primeiro contato e transformar a presença digital em uma ferramenta de relacionamento e geração de novas oportunidades.`
  );

  // Lâmina Análise das Redes
  const [analiseMockupUrl, setAnaliseMockupUrl] = useState(
    propostaInicial?.analiseRedes?.perfilMockupUrl ||
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80'
  );
  const [analiseDiagnostico, setAnaliseDiagnostico] = useState(
    propostaInicial?.analiseRedes?.descricaoDiagnostico ||
      'Atualmente o perfil ainda está muito pessoal e sem estratégia, as artes presentes podem ser melhoradas e os vídeos podem ser mais bem trabalhados.'
  );
  const [oportunidades, setOportunidades] = useState<string[]>(
    propostaInicial?.analiseRedes?.oportunidadesMelhoria || [
      'Posicionamento mais profissional;',
      'Fortalecimento da identidade visual;',
      'Estruturação da estratégia de marca;',
      'Humanização da comunicação;',
      'Otimização da conversão de clientes;',
      'Integração do ecossistema digital.',
    ]
  );
  const [novaOportunidade, setNovaOportunidade] = useState('');

  // Módulo Gestão de Redes
  const [moduloRedesAtivo, setModuloRedesAtivo] = useState(
    propostaInicial?.modulos?.gestaoRedes?.ativo ?? true
  );
  const [postsPorSemana, setPostsPorSemana] = useState(
    propostaInicial?.modulos?.gestaoRedes?.postsPorSemana || '02 a 03 posts por semana'
  );
  const [videosMes, setVideosMes] = useState(
    propostaInicial?.modulos?.gestaoRedes?.videosProfissionaisMes || 9
  );
  const [artesMes, setArtesMes] = useState(
    propostaInicial?.modulos?.gestaoRedes?.artesMes || 3
  );
  const [fotosMes, setFotosMes] = useState(
    propostaInicial?.modulos?.gestaoRedes?.fotosMes || 3
  );
  const [videomakerVisita, setVideomakerVisita] = useState(
    propostaInicial?.modulos?.gestaoRedes?.videomakerVisita ||
      'Uma visita por mês de 2 horas de gravação (levamos equipamento e roteiro).'
  );
  const [naoIncluso, setNaoIncluso] = useState(
    propostaInicial?.modulos?.gestaoRedes?.naoIncluso ||
      'Responder mensagens e comentários, e postar stories no dia a dia.'
  );

  // Módulo Meta Ads
  const [moduloMetaAtivo, setModuloMetaAtivo] = useState(
    propostaInicial?.modulos?.metaAds?.ativo ?? true
  );
  const [metaVerbaDiaria, setMetaVerbaDiaria] = useState(
    propostaInicial?.modulos?.metaAds?.verbaSugeridaDiaria || 30
  );

  // Módulo Google Ads
  const [moduloGoogleAtivo, setModuloGoogleAtivo] = useState(
    propostaInicial?.modulos?.googleAds?.ativo ?? false
  );
  const [googleVerbaDiaria, setGoogleVerbaDiaria] = useState(
    propostaInicial?.modulos?.googleAds?.verbaSugeridaDiaria || 30
  );

  // Módulo Site
  const [moduloSiteAtivo, setModuloSiteAtivo] = useState(
    propostaInicial?.modulos?.site?.ativo ?? false
  );

  // Serviços Adicionais Personalizados
  const [servicosCustomizados, setServicosCustomizados] = useState<ServicoCustomizado[]>(
    propostaInicial?.modulos?.outrosServicos || []
  );

  // Valores (De: / POR:)
  const [precoDe, setPrecoDe] = useState<number>(propostaInicial?.precoDe || 2500);
  const [precoPor, setPrecoPor] = useState<number>(propostaInicial?.precoPor || 1500);
  const [condicaoMensalidade, setCondicaoMensalidade] = useState(
    propostaInicial?.condicaoPrimeiraMensalidade ||
      'Até o prazo de validade desta proposta a primeira mensalidade fica com condição especial de R$ 1.000,00.'
  );
  const [bonusTexto, setBonusTexto] = useState(
    (propostaInicial?.bonusInclusos || [
      'Além das gravações feitas pela nossa equipe, o cliente pode enviar fotos e vídeos para edição',
      'Treinamento da equipe de atendimento/comercial para conversão de leads',
      'Acompanhamento semanal da gestão de tráfego pago',
    ]).join('\n')
  );

  // Validade e Status
  const diffDiasCalculado = propostaInicial?.dataValidade
    ? Math.max(1, Math.round((new Date(propostaInicial.dataValidade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 7;
  const [diasValidade, setDiasValidade] = useState<number>(diffDiasCalculado);
  const [status, setStatus] = useState<StatusProposta>(propostaInicial?.status || 'ativo');
  const [tokenSeguro] = useState(propostaInicial?.token || gerarTokenSeguro());

  // SEÇÕES ESPECÍFICAS DESTA PROPOSTA (ISOLAMENTO MULTI-PROPOSTA)
  const [secoesProposta, setSecoesProposta] = useState<SecaoConfiguravel[]>(() => {
    if (propostaInicial?.secoesPersonalizadas && propostaInicial.secoesPersonalizadas.length > 0) {
      return propostaInicial.secoesPersonalizadas;
    }
    return config.secoesOrdem;
  });

  // Menu Vertical Ativo
  const [menuAtivo, setMenuAtivo] = useState<
    'cliente' | 'projeto' | 'modulos' | 'servicos_extras' | 'valores' | 'secoes' | 'validade'
  >('cliente');

  // Erros de Validação Zod
  const [errosValidacao, setErrosValidacao] = useState<Record<string, string>>({});

  // Feedback Popup
  const [feedback, setFeedback] = useState<PopupFeedback>({
    tipo: 'sucesso',
    titulo: '',
    mensagem: '',
    aberto: false,
  });

  // Checagem de permissão para criar seções
  const podeCriarNovasSecoes = 
    usuarioAtual.papel === 'admin' || 
    config.usuarioComercialPodeCriarSecoes || 
    usuarioAtual.podeCriarSecoes;

  // Resetar ordem das seções para o padrão definido pelo Admin no CMS
  const handleResetarSecoesParaPadrao = () => {
    if (confirm('Deseja resetar a ordem e visibilidade das seções desta proposta para o modelo padrão da agência?')) {
      setSecoesProposta(config.secoesOrdem);
      setFeedback({
        tipo: 'sucesso',
        titulo: 'Seções Resetadas',
        mensagem: 'A estrutura desta proposta voltou exatamente ao padrão do Admin.',
        aberto: true,
      });
    }
  };

  const moverSecao = (index: number, direcao: 'cima' | 'baixo') => {
    const novas = [...secoesProposta];
    const target = direcao === 'cima' ? index - 1 : index + 1;
    if (target < 0 || target >= novas.length) return;
    const temp = novas[index];
    novas[index] = novas[target];
    novas[target] = temp;
    setSecoesProposta(novas);
  };

  const alternarVisibilidadeSecao = (id: string) => {
    setSecoesProposta(prev => prev.map(s => s.id === id ? { ...s, ativo: !s.ativo } : s));
  };

  const handleUploadMockup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validacao = validarUploadImagem(file);
    if (!validacao.valido) {
      setFeedback({
        tipo: 'erro',
        titulo: 'Arquivo Inválido',
        mensagem: validacao.mensagemErro || 'Erro no upload da imagem.',
        aberto: true,
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAnaliseMockupUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSalvarPropostaFinal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrosValidacao({});

    // Validação com ZOD
    const validacaoZod = propostaZodSchema.safeParse({
      titulo,
      clienteNome,
      clienteEmpresa,
      clienteEmail,
      clienteTelefone,
      precoDe: Number(precoDe),
      precoPor: Number(precoPor),
      diasValidade: Number(diasValidade),
    });

    if (!validacaoZod.success) {
      const errosMap: Record<string, string> = {};
      validacaoZod.error.issues.forEach(issue => {
        const campo = issue.path[0] as string;
        errosMap[campo] = issue.message;
      });
      setErrosValidacao(errosMap);
      setFeedback({
        tipo: 'erro',
        titulo: 'Campos Obrigatórios Pendentes',
        mensagem: 'Por favor, revise os dados sinalizados em vermelho antes de salvar.',
        aberto: true,
      });
      setMenuAtivo('cliente');
      return;
    }

    const agora = new Date();
    const dataValidade = new Date(agora.getTime() + diasValidade * 24 * 60 * 60 * 1000).toISOString();

    const bonusList = bonusTexto
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    const propostaPronta: Proposta = {
      id: propostaInicial?.id || `prop_${Date.now()}`,
      token: tokenSeguro,
      slug: slugFinal,
      titulo: sanitizarTexto(titulo),
      clienteNome: sanitizarTexto(clienteNome),
      clienteEmpresa: sanitizarTexto(clienteEmpresa),
      clienteEmail: sanitizarTexto(clienteEmail),
      clienteTelefone: sanitizarTexto(clienteTelefone),
      clienteDocumento: sanitizarTexto(clienteDocumento),
      clienteSegmento: sanitizarTexto(clienteSegmento),
      clienteInstagram: sanitizarTexto(clienteInstagram),

      projetoTexto: sanitizarTexto(projetoTexto),
      analiseRedes: {
        perfilMockupUrl: analiseMockupUrl,
        descricaoDiagnostico: sanitizarTexto(analiseDiagnostico),
        oportunidadesMelhoria: oportunidades,
      },

      modulos: {
        gestaoRedes: {
          ativo: moduloRedesAtivo,
          titulo: 'Gestão Estratégica de Redes Sociais',
          postsPorSemana: sanitizarTexto(postsPorSemana),
          videosProfissionaisMes: Number(videosMes),
          artesMes: Number(artesMes),
          fotosMes: Number(fotosMes),
          videomakerVisita: sanitizarTexto(videomakerVisita),
          postagensEstrategicas: 'Copywriting persuasivo e agendamento otimizado.',
          naoIncluso: sanitizarTexto(naoIncluso),
          redesAtendidas: ['Instagram', 'Facebook'],
          valorMensal: precoPor,
        },
        metaAds: {
          ativo: moduloMetaAtivo,
          titulo: 'Gestão de Tráfego Pago (Meta Ads)',
          plataforma: 'Meta Ads',
          chamadaDestaque: 'AQUI É ONDE SUA EMPRESA FAZ DINHEIRO',
          descricao: 'Anúncios altamente segmentados focados em conversão direta no WhatsApp e Direct.',
          verbaSugeridaDiaria: Number(metaVerbaDiaria),
          entregaveis: ['Configuração de pixel', 'Criação de públicos', 'Otimização diária de ROI'],
        },
        googleAds: {
          ativo: moduloGoogleAtivo,
          titulo: 'Gestão de Tráfego Pago (Google Ads)',
          plataforma: 'Google Ads',
          chamadaDestaque: 'CAPTAÇÃO DE INTENÇÃO DE COMPRA ATIVA',
          descricao: 'Anúncios na Rede de Pesquisa e Google Maps para capturar clientes no momento de busca.',
          verbaSugeridaDiaria: Number(googleVerbaDiaria),
          entregaveis: ['Palavras-chave negativas', 'Otimização de índice de qualidade'],
        },
        site: {
          ativo: moduloSiteAtivo,
          titulo: 'Landing Page de Alta Conversão',
          chamadaDestaque: 'ESTRUTURA DIGITAL DE ALTO IMPACTO',
          descricao: 'Página rápida, responsiva e integrada com botões de WhatsApp e pixels.',
          entregaveis: ['Design mobile-first', 'Copywriting persuasivo'],
        },
        outrosServicos: servicosCustomizados,
      },

      precoDe: Number(precoDe),
      precoPor: Number(precoPor),
      condicaoPrimeiraMensalidade: condicaoMensalidade,
      bonusInclusos: bonusList,

      // Seções isoladas desta proposta
      secoesPersonalizadas: secoesProposta,

      // Campos legados mantidos para compatibilidade
      apresentacao: projetoTexto,
      objetivos: oportunidades,
      entregaveis: [],
      valorTotal: Number(precoPor),
      descontoAplicado: Math.max(0, Number(precoDe) - Number(precoPor)),
      condicoesPagamento: 'Mensalidade recorrente via PIX / Boleto bancário.',
      parcelamentoMax: 12,
      dataEmissao: propostaInicial?.dataEmissao || agora.toISOString(),
      dataValidade,
      status,
      visualizacoes: propostaInicial?.visualizacoes || 0,
      
      // Consultor Criador (para o WhatsApp automático)
      criadoPor: propostaInicial?.criadoPor || usuarioAtual.nome,
      criadoPorId: propostaInicial?.criadoPorId || usuarioAtual.id,
      criadoPorWhatsapp: propostaInicial?.criadoPorWhatsapp || usuarioAtual.whatsapp || config.telefoneWhatsapp,

      criadoEm: propostaInicial?.criadoEm || agora.toISOString(),
      atualizadoEm: agora.toISOString(),
    };

    onSalvar(propostaPronta);
    setFeedback({
      tipo: 'sucesso',
      titulo: isEdicao ? 'Proposta Atualizada!' : 'Proposta Criada com Sucesso!',
      mensagem: `A proposta "${propostaPronta.titulo}" para ${propostaPronta.clienteEmpresa} está ativa. O botão de WhatsApp direciona para ${propostaPronta.criadoPorWhatsapp}.`,
      aberto: true,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onVoltar}
            className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="Voltar ao Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {isEdicao ? `Editar Proposta • ${clienteEmpresa || 'Cliente'}` : 'Nova Proposta Comercial'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Criada pelo consultor <strong className="text-zinc-800 dark:text-zinc-200">{usuarioAtual.nome}</strong> • WhatsApp: {usuarioAtual.whatsapp}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVoltar}
            className="px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSalvarPropostaFinal()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-xl transition-transform active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Salvar Proposta Comercial
          </button>
        </div>
      </div>

      {/* LAYOUT: MENU VERTICAL À ESQUERDA & CONTEÚDO À DIREITA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* MENU VERTICAL */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm space-y-1">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Etapas da Proposta
          </div>

          {[
            { id: 'cliente', label: '1. Dados do Cliente', icon: Building2, erro: !!(errosValidacao.clienteEmpresa || errosValidacao.clienteNome || errosValidacao.clienteEmail || errosValidacao.clienteTelefone) },
            { id: 'projeto', label: '2. Projeto & Diagnóstico', icon: Sparkles },
            { id: 'modulos', label: '3. Redes Sociais & Ads', icon: Layers },
            { id: 'servicos_extras', label: '4. Serviços Adicionais', icon: Briefcase, badge: `${servicosCustomizados.length}` },
            { id: 'valores', label: '5. Investimento & Bônus', icon: DollarSign, erro: !!(errosValidacao.precoDe || errosValidacao.precoPor) },
            { id: 'secoes', label: '6. Ordem das Seções', icon: Sliders },
            { id: 'validade', label: '7. Vigência & Status', icon: Clock },
          ].map(item => {
            const Icon = item.icon;
            const ativo = menuAtivo === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMenuAtivo(item.id as any)}
                className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  ativo
                    ? 'bg-purple-900 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${ativo ? 'text-amber-400' : 'text-zinc-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.erro ? (
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                ) : item.badge ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${ativo ? 'bg-purple-800 text-purple-200' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* PAINEL DE CONTEÚDO ATIVO */}
        <div className="lg:col-span-9 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
          
          {/* ======================================================== */}
          {/* ABA 1: DADOS DO CLIENTE & CONTATO */}
          {/* ======================================================== */}
          {menuAtivo === 'cliente' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Dados do Cliente & Informações de Contato
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Preencha os dados do cliente para personalização automática de todas as lâminas da proposta.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Título da Proposta Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex: Posicionamento Estratégico & Gestão de Performance"
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-600 outline-none"
                />
                {errosValidacao.titulo && <p className="text-xs text-rose-500 mt-1">{errosValidacao.titulo}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Nome da Empresa / Clínica *
                  </label>
                  <input
                    type="text"
                    required
                    value={clienteEmpresa}
                    onChange={e => setClienteEmpresa(e.target.value)}
                    placeholder="Ex: Dra. Melissa Esteves e Dr. Pedro Bueno"
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                  {errosValidacao.clienteEmpresa && <p className="text-xs text-rose-500 mt-1">{errosValidacao.clienteEmpresa}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Nome do Responsável Legal *
                  </label>
                  <input
                    type="text"
                    required
                    value={clienteNome}
                    onChange={e => setClienteNome(e.target.value)}
                    placeholder="Ex: Melissa Esteves"
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                  {errosValidacao.clienteNome && <p className="text-xs text-rose-500 mt-1">{errosValidacao.clienteNome}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    URL personalizada
                  </label>
                  <div className="flex items-stretch rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden focus-within:ring-2 focus-within:ring-purple-600">
                    <span className="hidden sm:flex items-center px-3 text-xs font-mono text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
                      {getBaseUrlApp().replace(/^https?:\/\//, '')}/{PREFIXO_URL_PROPOSTA}
                    </span>
                    <input
                      type="text"
                      value={slugEditadoManual ? slugDigitado : slugFinal}
                      onChange={e => {
                        setSlugEditadoManual(true);
                        setSlugDigitado(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                      }}
                      onBlur={() => {
                        if (!slugify(slugDigitado)) { setSlugEditadoManual(false); setSlugDigitado(''); }
                        else setSlugDigitado(slugify(slugDigitado));
                      }}
                      placeholder="nome-do-cliente"
                      className="flex-1 min-w-0 px-4 py-3 bg-transparent text-sm font-mono text-zinc-900 dark:text-white outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 break-all">
                    Link final: <span className="font-mono text-purple-700 dark:text-purple-300">{getBaseUrlApp()}/{PREFIXO_URL_PROPOSTA}{slugFinal}</span>
                    {slugEmConflito && <span className="text-amber-600"> (já em uso — ajustado automaticamente)</span>}
                    {!slugEditadoManual && <span> • gerado a partir do nome da empresa</span>}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    E-mail Corporativo do Cliente *
                  </label>
                  <input
                    type="email"
                    required
                    value={clienteEmail}
                    onChange={e => setClienteEmail(e.target.value)}
                    placeholder="Ex: contato@estevesebueno.com.br"
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                  {errosValidacao.clienteEmail && <p className="text-xs text-rose-500 mt-1">{errosValidacao.clienteEmail}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Telefone / WhatsApp do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={clienteTelefone}
                    onChange={e => setClienteTelefone(maskPhone(e.target.value))}
                    maxLength={17}
                    placeholder="+55 11 99999-9999"
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                  {errosValidacao.clienteTelefone && <p className="text-xs text-rose-500 mt-1">{errosValidacao.clienteTelefone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Segmento de Atuação
                  </label>
                  <input
                    type="text"
                    value={clienteSegmento}
                    onChange={e => setClienteSegmento(e.target.value)}
                    placeholder="Ex: Odontologia Estética"
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Instagram do Cliente
                  </label>
                  <input
                    type="text"
                    value={clienteInstagram}
                    onChange={e => setClienteInstagram(e.target.value)}
                    placeholder="Ex: @estevesebueno"
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    CNPJ / CPF
                  </label>
                  <input
                    type="text"
                    value={clienteDocumento}
                    onChange={e => setClienteDocumento(e.target.value)}
                    placeholder="Ex: 34.567.890/0001-12"
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2: PROJETO & DIAGNÓSTICO */}
          {/* ======================================================== */}
          {menuAtivo === 'projeto' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Lâminas Projeto & Diagnóstico das Redes
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Texto da Lâmina &quot;Projeto&quot;
                </label>
                <textarea
                  rows={5}
                  value={projetoTexto}
                  onChange={e => setProjetoTexto(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs sm:text-sm text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Mockup do Perfil das Redes (Foto / Print)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={analiseMockupUrl}
                      onChange={e => setAnaliseMockupUrl(e.target.value)}
                      placeholder="URL ou faça upload"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
                    />
                    <label className="p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0">
                      <Upload className="w-4 h-4 text-purple-600" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadMockup}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Diagnóstico Atual das Redes
                  </label>
                  <textarea
                    rows={2}
                    value={analiseDiagnostico}
                    onChange={e => setAnaliseDiagnostico(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
                  />
                </div>
              </div>

              {/* OPORTUNIDADES IDENTIFICADAS */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  Oportunidades de Melhoria Identificadas
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novaOportunidade}
                    onChange={e => setNovaOportunidade(e.target.value)}
                    placeholder="Adicionar oportunidade identificada..."
                    className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (novaOportunidade.trim()) {
                        setOportunidades([...oportunidades, novaOportunidade.trim()]);
                        setNovaOportunidade('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs"
                  >
                    + Adicionar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {oportunidades.map((op, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
                      <span className="truncate">{op}</span>
                      <button
                        type="button"
                        onClick={() => setOportunidades(oportunidades.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 3: MÓDULOS DE REDES & ADS */}
          {/* ======================================================== */}
          {menuAtivo === 'modulos' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  Lâminas de Serviços Comerciais (Redes, Meta Ads, Google Ads)
                </h3>
              </div>

              {/* CARD GESTÃO DE REDES */}
              <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">
                    Módulo: Gestão Estratégica de Redes Sociais
                  </span>
                  <input
                    type="checkbox"
                    checked={moduloRedesAtivo}
                    onChange={e => setModuloRedesAtivo(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                </div>

                {moduloRedesAtivo && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Posts/Semana</label>
                      <input
                        type="text"
                        value={postsPorSemana}
                        onChange={e => setPostsPorSemana(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Vídeos/Mês</label>
                      <input
                        type="number"
                        value={videosMes}
                        onChange={e => setVideosMes(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Artes/Mês</label>
                      <input
                        type="number"
                        value={artesMes}
                        onChange={e => setArtesMes(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Fotos/Mês</label>
                      <input
                        type="number"
                        value={fotosMes}
                        onChange={e => setFotosMes(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CARD META ADS */}
              <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-zinc-900 dark:text-white block">
                      Módulo: Tráfego Pago (Meta Ads)
                    </span>
                    <span className="text-xs text-amber-600 font-semibold">
                      &quot;AQUI É ONDE SUA EMPRESA FAZ DINHEIRO&quot;
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={moduloMetaAtivo}
                    onChange={e => setModuloMetaAtivo(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                </div>

                {moduloMetaAtivo && (
                  <div>
                    <label className="text-xs font-bold uppercase text-zinc-400 block mb-1">
                      Verba Direta Diária Sugerida (R$)
                    </label>
                    <input
                      type="number"
                      value={metaVerbaDiaria}
                      onChange={e => setMetaVerbaDiaria(Number(e.target.value))}
                      className="w-full sm:w-60 px-4 py-2.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-bold font-mono"
                    />
                  </div>
                )}
              </div>

              {/* CARD GOOGLE ADS */}
              <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-zinc-900 dark:text-white block">
                      Módulo: Tráfego Pago (Google Ads)
                    </span>
                    <span className="text-xs text-blue-600 font-semibold">
                      Rede de Pesquisa & Google Maps
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={moduloGoogleAtivo}
                    onChange={e => setModuloGoogleAtivo(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                </div>

                {moduloGoogleAtivo && (
                  <div>
                    <label className="text-xs font-bold uppercase text-zinc-400 block mb-1">
                      Verba Direta Diária Google (R$)
                    </label>
                    <input
                      type="number"
                      value={googleVerbaDiaria}
                      onChange={e => setGoogleVerbaDiaria(Number(e.target.value))}
                      className="w-full sm:w-60 px-4 py-2.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-bold font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 4: SERVIÇOS ADICIONAIS PERSONALIZADOS */}
          {/* ======================================================== */}
          {menuAtivo === 'servicos_extras' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    Serviços Customizados da Proposta
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Adicione lâminas de serviços adicionais específicos para este cliente (ex: Google Meu Negócio, Reels Extras, Branding).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const novoServico: ServicoCustomizado = {
                      id: `srv_${Date.now()}`,
                      ativo: true,
                      titulo: 'Gestão de Google Meu Negócio & Avaliações',
                      chamadaDestaque: 'AUTORIDADE LOCAL & MAPAS',
                      descricao: 'Otimização das fotos, respostas de reviews e ranqueamento local.',
                      valorMensal: 500,
                      entregaveis: ['Fotos 360 semanais', 'Respostas estratégicas'],
                    };
                    setServicosCustomizados([...servicosCustomizados, novoServico]);
                  }}
                  className="px-4 py-2 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md"
                >
                  + Adicionar Serviço Customizado
                </button>
              </div>

              {servicosCustomizados.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  Nenhum serviço extra configurado. Clique acima para incluir novas soluções no escopo.
                </div>
              ) : (
                <div className="space-y-4">
                  {servicosCustomizados.map((srv, idx) => (
                    <div key={srv.id} className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={srv.titulo}
                          onChange={e => {
                            const novos = [...servicosCustomizados];
                            novos[idx] = { ...novos[idx], titulo: e.target.value };
                            setServicosCustomizados(novos);
                          }}
                          className="font-bold text-sm px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-1 mr-3"
                        />
                        <button
                          type="button"
                          onClick={() => setServicosCustomizados(servicosCustomizados.filter(s => s.id !== srv.id))}
                          className="text-rose-500 hover:text-rose-700 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={srv.chamadaDestaque || ''}
                          onChange={e => {
                            const novos = [...servicosCustomizados];
                            novos[idx] = { ...novos[idx], chamadaDestaque: e.target.value };
                            setServicosCustomizados(novos);
                          }}
                          placeholder="Chamada de Destaque"
                          className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                        />
                        <input
                          type="number"
                          value={srv.valorMensal || ''}
                          onChange={e => {
                            const novos = [...servicosCustomizados];
                            novos[idx] = { ...novos[idx], valorMensal: Number(e.target.value) };
                            setServicosCustomizados(novos);
                          }}
                          placeholder="Valor Adicional (R$)"
                          className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={srv.descricao}
                        onChange={e => {
                          const novos = [...servicosCustomizados];
                          novos[idx] = { ...novos[idx], descricao: e.target.value };
                          setServicosCustomizados(novos);
                        }}
                        placeholder="Descrição do serviço e entregáveis"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 5: VALORES & CONDIÇÕES ESPECIAIS */}
          {/* ======================================================== */}
          {menuAtivo === 'valores' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Investimento & Condição Especial (De: / POR:)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Preço de Tabela (De:) *
                  </label>
                  <input
                    type="number"
                    required
                    value={precoDe}
                    onChange={e => setPrecoDe(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-lg font-black font-mono"
                  />
                  {errosValidacao.precoDe && <p className="text-xs text-rose-500 mt-1">{errosValidacao.precoDe}</p>}
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                  <label className="block text-xs font-bold uppercase text-purple-700 dark:text-purple-300 mb-1">
                    Preço de Investimento (POR:) *
                  </label>
                  <input
                    type="number"
                    required
                    value={precoPor}
                    onChange={e => setPrecoPor(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-zinc-900 text-lg font-black font-mono text-purple-900 dark:text-purple-300"
                  />
                  {errosValidacao.precoPor && <p className="text-xs text-rose-500 mt-1">{errosValidacao.precoPor}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Texto da Condição Especial na 1ª Mensalidade
                </label>
                <input
                  type="text"
                  value={condicaoMensalidade}
                  onChange={e => setCondicaoMensalidade(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs sm:text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Bônus e Diferenciais Inclusos (Um por linha)
                </label>
                <textarea
                  rows={4}
                  value={bonusTexto}
                  onChange={e => setBonusTexto(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs sm:text-sm"
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 6: ORDEM DAS SEÇÕES DESTA PROPOSTA (ISOLADA) */}
          {/* ======================================================== */}
          {menuAtivo === 'secoes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-purple-600" />
                    Estrutura & Seções Desta Proposta
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Personalize quais seções aparecem para este cliente. Suas alterações se aplicam <strong>somente a esta proposta</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetarSecoesParaPadrao}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                  Resetar para Padrão do Admin
                </button>
              </div>

              <div className="space-y-2">
                {secoesProposta.map((secao, idx) => (
                  <div 
                    key={secao.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      secao.ativo 
                        ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700' 
                        : 'bg-zinc-100/40 dark:bg-zinc-900/40 border-zinc-200/40 dark:border-zinc-800/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-xs text-zinc-900 dark:text-white block">
                          {secao.titulo}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {secao.descricao}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moverSecao(idx, 'cima')}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === secoesProposta.length - 1}
                        onClick={() => moverSecao(idx, 'baixo')}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => alternarVisibilidadeSecao(secao.id)}
                        className={`p-1.5 rounded-lg ${secao.ativo ? 'text-purple-600' : 'text-zinc-400'}`}
                      >
                        {secao.ativo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 7: VIGÊNCIA & STATUS */}
          {/* ======================================================== */}
          {menuAtivo === 'validade' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Vigência, Token Seguro & Status do Link
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Prazo de Validade (Dias a contar de hoje)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={diasValidade}
                    onChange={e => setDiasValidade(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-bold"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Após essa data, o link público exibirá a tela amigável de expiração HTTP 410.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Status Inicial da Proposta
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as StatusProposta)}
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-bold"
                  >
                    <option value="ativo">Ativo (Link Liberado para Acesso)</option>
                    <option value="rascunho">Rascunho (Não visível ao cliente)</option>
                    <option value="inativo">Inativo (Pausado temporariamente)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="text-xs font-bold uppercase text-zinc-400 block">
                  Token Criptográfico do Link Público (64 Caracteres)
                </span>
                <code className="text-xs font-mono text-purple-700 dark:text-purple-300 block break-all select-all">
                  {tokenSeguro}
                </code>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* FEEDBACK POPUP GLOBAL */}
      <FeedbackPopup
        feedback={feedback}
        onFechar={() => setFeedback(prev => ({ ...prev, aberto: false }))}
      />

    </div>
  );
};
