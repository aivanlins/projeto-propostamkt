import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle2, ShieldCheck, 
  MessageSquare, Sparkles, Building2, User, Mail, Phone,
  CreditCard, Award, ChevronRight, Lock, Check, Instagram, 
  Video, Camera, FileCheck, CheckSquare, XCircle, ArrowRight,
  ExternalLink, Layers, AlignLeft, List, MousePointerClick,
  Download, Target, TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Proposta, ConfiguracaoFixa, SecaoConfiguravel, LinhaSecao, ColunaSecao, WidgetItem } from '../../types';
import { CONFIGURACAO_FIXA_INICIAL } from '../../mockData';
import { 
  verificarStatusExpiraUrl, 
  formatarMoeda, 
  formatarData, 
  formatarDataHora 
} from '../../utils/security';
import { ExpiredScreen } from '../ExpiredScreen';

interface ClientProposalViewProps {
  proposta: Proposta;
  config: ConfiguracaoFixa;
  onVoltarParaPainel?: () => void;
  onSimularAtivacao?: () => void;
  onAceitarProposta?: (nomeResponsavel: string, documento: string) => void;
}

export const ClientProposalView: React.FC<ClientProposalViewProps> = ({
  proposta,
  config,
  onVoltarParaPainel,
  onSimularAtivacao,
  onAceitarProposta,
}) => {
  const statusUrl = verificarStatusExpiraUrl(proposta);

  // Seções específicas desta proposta (se houver customização) ou fallback para o padrão do CMS
  const secoesOrdem: SecaoConfiguravel[] = (
    proposta?.secoesPersonalizadas && 
    Array.isArray(proposta.secoesPersonalizadas) && 
    proposta.secoesPersonalizadas.length > 0
  )
    ? proposta.secoesPersonalizadas
    : (
      config?.secoesOrdem && 
      Array.isArray(config.secoesOrdem) && 
      config.secoesOrdem.length > 0
    )
    ? config.secoesOrdem
    : CONFIGURACAO_FIXA_INICIAL.secoesOrdem;

  const fundadores = config?.fundadores || CONFIGURACAO_FIXA_INICIAL.fundadores;
  const premiacao = config?.premiacao || CONFIGURACAO_FIXA_INICIAL.premiacao;
  const time = config?.time || CONFIGURACAO_FIXA_INICIAL.time;
  const servicos = config?.servicosInstitucionais || CONFIGURACAO_FIXA_INICIAL.servicosInstitucionais;
  const clientes = config?.clientesApresentados || CONFIGURACAO_FIXA_INICIAL.clientesApresentados;
  const capa = config?.capa || CONFIGURACAO_FIXA_INICIAL.capa;

  const [modalAceiteAberto, setModalAceiteAberto] = useState(false);
  const [nomeAssinante, setNomeAssinante] = useState(proposta.clienteNome || '');
  const [cargoAssinante, setCargoAssinante] = useState('Diretor(a) / Responsável Legal');
  const [termoAceito, setTermoAceito] = useState(false);
  const [propostaAceitaLocal, setPropostaAceitaLocal] = useState(proposta.status === 'aceito');

  // Contador regressivo de validade
  const [tempoRestante, setTempoRestante] = useState({
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
    expirou: false,
  });

  useEffect(() => {
    function calcular() {
      const agora = new Date().getTime();
      const validade = new Date(proposta.dataValidade).getTime();
      const diff = validade - agora;

      if (diff <= 0) {
        setTempoRestante({ dias: 0, horas: 0, minutos: 0, segundos: 0, expirou: true });
        return;
      }

      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60)) / (1000 * 60));
      const segundos = Math.floor((diff % (1000 * 60)) / 1000);

      setTempoRestante({ dias, horas, minutos, segundos, expirou: false });
    }

    calcular();
    const interval = setInterval(calcular, 1000);
    return () => clearInterval(interval);
  }, [proposta.dataValidade]);

  // Rastreamento de rolagem para Parallax e Seleção Dinâmica do Quadradinho Ativo
  const [secaoAtivaId, setSecaoAtivaId] = useState<string>('hero_capa');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const secoesVisiveis = secoesOrdem.filter(s => s.ativo && s.mostrarNoMenuFlutuante !== false);
      for (let i = secoesVisiveis.length - 1; i >= 0; i--) {
        const el = document.getElementById(secoesVisiveis[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.45) {
            setSecaoAtivaId(secoesVisiveis[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [secoesOrdem]);

  // Se a URL estiver expirada ou inativa, exibe a tela segura HTTP 410
  if (!statusUrl.acessoPermitido) {
    return (
      <ExpiredScreen
        proposta={proposta}
        config={config}
        motivoBloqueio={statusUrl.motivoBloqueio}
        onVoltarParaPainel={onVoltarParaPainel}
        onSimularAtivacao={onSimularAtivacao}
      />
    );
  }

  const handleConfirmarAceite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termoAceito || !nomeAssinante.trim()) return;

    if (onAceitarProposta) {
      onAceitarProposta(nomeAssinante, cargoAssinante);
    }
    setPropostaAceitaLocal(true);
    setModalAceiteAberto(false);

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: [config.corPrimaria, config.corSecundaria, '#10B981'],
    });
  };

  // NÚMERO DE WHATSAPP DINÂMICO DO CONSULTOR QUE CRIOU A PROPOSTA
  const wppDestino = proposta.criadoPorWhatsapp || config?.telefoneWhatsapp || '';
  const telefoneLimpo = wppDestino.replace(/\D/g, '');
  const consultorDestino = proposta.criadoPor || 'Consultor Comercial';
  const mensagemWpp = encodeURIComponent(
    `Olá ${consultorDestino}! Estava visualizando a proposta comercial "${proposta.titulo}" de ${config.nomeAgencia || 'sua agência'} para a ${proposta.clienteEmpresa || proposta.clienteNome} e gostaria de dar andamento.`
  );
  const linkWhatsApp = telefoneLimpo ? `https://wa.me/${telefoneLimpo}?text=${mensagemWpp}` : '#';

  // RENDERIZADOR DINÂMICO DE WIDGETS
  const renderWidget = (widget: WidgetItem) => {
    const { tipo, conteudo } = widget;
    switch (tipo) {
      case 'titulo':
        return (
          <h3 
            className={`font-black tracking-tight leading-tight mb-2 ${
              conteudo.tamanho === '2xl' ? 'text-3xl sm:text-4xl' :
              conteudo.tamanho === 'xl' ? 'text-2xl sm:text-3xl' :
              conteudo.tamanho === 'lg' ? 'text-xl sm:text-2xl' : 'text-lg'
            }`}
            style={{ 
              color: conteudo.corTexto || conteudo.cor || config.corPrimaria,
              textAlign: conteudo.alinhamento || 'left'
            }}
          >
            {conteudo.texto}
          </h3>
        );
      case 'texto':
        return (
          <p 
            className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3 whitespace-pre-line"
            style={{ 
              color: conteudo.corTexto || conteudo.cor || undefined,
              textAlign: conteudo.alinhamento || 'left' 
            }}
          >
            {conteudo.texto}
          </p>
        );
      case 'imagem':
        return (
          <div className="my-3">
            <img 
              src={conteudo.urlImagem || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80'} 
              alt={conteudo.altImagem || 'Imagem da Proposta'}
              className="rounded-2xl w-full object-cover shadow-lg border border-zinc-200 dark:border-zinc-800"
              style={{ maxHeight: `${conteudo.alturaImagemPx || 280}px` }}
            />
          </div>
        );
      case 'lista':
        const isHorizontal = conteudo.orientacaoLista === 'horizontal';
        return (
          <div className="my-3">
            <ul 
              className={`text-xs sm:text-sm ${
                isHorizontal ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 space-y-0' : 'space-y-2'
              }`}
              style={{ color: conteudo.corTexto || undefined }}
            >
              {(conteudo.itensLista && conteudo.itensLista.length > 0 ? conteudo.itensLista : ['Item da lista']).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'divisor':
        if (conteudo.orientacaoDivisor === 'vertical') {
          return (
            <div className="py-2 flex justify-center">
              <div 
                style={{ 
                  width: `${conteudo.espessuraDivisorPx || 2}px`, 
                  minHeight: '48px', 
                  backgroundColor: conteudo.corDivisor || '#9333EA',
                  borderRadius: '2px'
                }} 
              />
            </div>
          );
        }
        return (
          <hr 
            className="my-4 border-0" 
            style={{ 
              height: `${conteudo.espessuraDivisorPx || 1}px`, 
              backgroundColor: conteudo.corDivisor || '#E4E4E7',
              opacity: 0.8
            }} 
          />
        );
      case 'botao':
        return (
          <div className="my-3" style={{ textAlign: conteudo.alinhamento || 'left' }}>
            <a
              href={conteudo.urlBotao || linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-lg hover:scale-105 transition-transform"
              style={{ backgroundColor: config.corPrimaria }}
            >
              <MousePointerClick className="w-4 h-4" />
              <span>{conteudo.textoBotao || 'Conversar Agora'}</span>
            </a>
          </div>
        );
      case 'box':
        return (
          <div 
            className="p-5 rounded-2xl border transition-all duration-200 shadow-xs space-y-2"
            style={{
              backgroundColor: conteudo.corFundoBox || 'rgba(255, 255, 255, 0.05)',
              borderColor: conteudo.corBordaBox || '#e4e4e7',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 
                className="font-bold text-sm sm:text-base" 
                style={{ color: conteudo.corTextoBox || undefined }}
              >
                {conteudo.tituloBox || 'Título do Box'}
              </h3>
              {conteudo.tagDestaque && (
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                >
                  {conteudo.tagDestaque}
                </span>
              )}
            </div>
            {conteudo.textoBox && (
              <p 
                className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap"
                style={{ color: conteudo.corTextoBox ? `${conteudo.corTextoBox}dd` : undefined }}
              >
                {conteudo.textoBox}
              </p>
            )}
          </div>
        );
      case 'tabela': {
        const numLinhas = Math.max(1, conteudo.linhasTabela || 2);
        const numColunas = Math.max(1, conteudo.colunasTabela || 2);
        const borderThickness = conteudo.espessuraBorda ?? 1;
        const borderColor = conteudo.corBorda || '#e4e4e7';
        const celulas = conteudo.celulasTabela || [];

        const getCelula = (r: number, c: number) => {
          return celulas.find(cell => cell.linha === r && cell.coluna === c) || {
            linha: r,
            coluna: c,
            tipo: 'texto' as const,
            texto: `Item [${r + 1}, ${c + 1}]`,
          };
        };

        const borderStyle = borderThickness === 0 
          ? 'none' 
          : `${borderThickness}px solid ${borderColor}`;

        return (
          <div className="w-full my-3 overflow-x-auto">
            <table 
              className="w-full border-collapse rounded-xl overflow-hidden"
              style={{
                border: borderStyle,
              }}
            >
              <tbody>
                {Array.from({ length: numLinhas }).map((_, rIdx) => (
                  <tr key={rIdx}>
                    {Array.from({ length: numColunas }).map((_, cIdx) => {
                      const cell = getCelula(rIdx, cIdx);
                      return (
                        <td
                          key={cIdx}
                          className="p-3 text-xs sm:text-sm align-middle"
                          style={{
                            border: borderStyle,
                            textAlign: cell.alinhamento || 'left',
                          }}
                        >
                          {cell.tipo === 'imagem' ? (
                            <div className="flex justify-center">
                              <img 
                                src={cell.urlImagem || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'} 
                                alt={`Célula ${rIdx + 1}-${cIdx + 1}`}
                                className="max-h-24 max-w-full rounded-lg object-contain shadow-xs"
                              />
                            </div>
                          ) : (
                            <div className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                              {cell.texto || ''}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      default:
        return null;
    }
  };

  // Helper de fundo personalizado com suporte a cobertura total
  const resolverEstiloSecao = (secaoItem: SecaoConfiguravel, estiloPadrao: { corFundo?: string; corTexto?: string } = {}) => {
    const estilo = secaoItem.estilo;
    const temImagem = Boolean(estilo?.imagemFundoUrl);
    return {
      backgroundColor: estilo?.corFundo || estiloPadrao.corFundo || undefined,
      backgroundImage: temImagem ? `url(${estilo?.imagemFundoUrl})` : undefined,
      backgroundSize: temImagem ? 'cover' : undefined,
      backgroundPosition: temImagem ? 'center' : undefined,
      backgroundRepeat: temImagem ? 'no-repeat' : undefined,
      color: estilo?.corTexto || estiloPadrao.corTexto || undefined,
    };
  };

  // RENDERIZAÇÃO DE QUALQUER SEÇÃO NATIVA BASE
  const renderSecaoNativa = (secaoItem: SecaoConfiguravel) => {
    // SEÇÕES ESTRUTURAIS NATIVAS DO SISTEMA
    switch (secaoItem.id) {
      // 1. CAPA OFICIAL DA PROPOSTA
      case 'hero_capa': {
        const capaFundoCor = secaoItem.estilo?.corFundo || capa?.corFundo || '#18181B';
        const capaCoverUrl = secaoItem.estilo?.imagemFundoUrl || capa?.imagemFundoUrl;
        const capaItensRodape = capa?.itensRodape || [
          { id: '1', texto: consultorDestino },
          ...(config.redesSociais?.website ? [{ id: '2', texto: config.redesSociais.website, link: config.redesSociais.website }] : []),
          ...(config.redesSociais?.instagram ? [{ id: '3', texto: config.redesSociais.instagram, link: config.redesSociais.instagram }] : []),
          ...(wppDestino ? [{ id: '4', texto: wppDestino }] : []),
        ];

        return (
          <section 
            id="hero_capa"
            key="hero_capa" 
            className="relative overflow-hidden rounded-3xl text-white p-8 sm:p-14 mb-8 shadow-2xl border border-zinc-800"
            style={{ 
              backgroundColor: capaFundoCor,
              backgroundImage: capaCoverUrl ? `url(${capaCoverUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {capaCoverUrl && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
            )}

            <div className="absolute inset-0 opacity-5 pointer-events-none select-none text-[80px] sm:text-[140px] font-black tracking-tighter leading-none flex items-center justify-center font-mono">
              {capa.marcaDaguaTexto || 'proposta comercial'}
            </div>

            <div className="relative z-10 flex flex-col justify-between min-h-[380px] sm:min-h-[440px]">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold tracking-wider uppercase text-zinc-300">
                <span>{config.nomeAgencia || 'PROPOSTA COMERCIAL'}</span>
                <span>DOCUMENTO OFICIAL</span>
              </div>

              <div className="my-auto text-center py-8">
                {config.logoUrl ? (
                  <div className="mb-4">
                    <img 
                      src={config.logoUrl} 
                      alt={config.nomeAgencia} 
                      className="max-h-20 max-w-xs mx-auto object-contain drop-shadow-xl" 
                    />
                  </div>
                ) : (
                  <div 
                    className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl border-4 sm:border-8 flex items-center justify-center shadow-2xl mb-4 text-2xl font-black uppercase"
                    style={{ borderColor: config.corSecundaria || '#0EA5E9', backgroundColor: config.corPrimaria || '#4F46E5' }}
                  >
                    {config.nomeAgencia ? config.nomeAgencia.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() : 'AG'}
                  </div>
                )}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-wider uppercase">
                  {capa.titulo || config.nomeAgencia || 'PROPOSTA COMERCIAL'}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 tracking-widest mt-2 uppercase">
                  {capa.subtitulo || config.slogan}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-purple-800/40 text-[11px] sm:text-xs text-purple-200">
                {capaItensRodape.map((item, itemIdx) => {
                  const itemKey = (item && typeof item === 'object' && item.id) ? item.id : `rodape_item_${itemIdx}`;
                  const itemTexto = typeof item === 'string' ? item : item?.texto;
                  const itemLink = typeof item === 'object' ? item?.link : undefined;

                  return (
                    <span key={itemKey} className="font-semibold">
                      {itemLink ? (
                        <a href={itemLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {itemTexto}
                        </a>
                      ) : (
                        itemTexto
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </section>
        );
      }

      // 2. SOBRE A AGÊNCIA
      case 'sobre_agencia': {
        const estilo = resolverEstiloSecao(secaoItem);
        return (
          <section 
            id="sobre_agencia"
            key="sobre_agencia" 
            className="relative overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 mb-8 border border-zinc-200 dark:border-zinc-800 shadow-sm"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            )}
            <div className="space-y-4 relative z-10">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ color: config.corSecundaria }}>
                {config.nomeAgencia || 'Sobre a Agência'}
              </h2>
              <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {config.sobreAgencia || CONFIGURACAO_FIXA_INICIAL.sobreAgencia}
              </p>
            </div>

            <div className="relative z-10">
              <div 
                className="absolute -top-3 -right-3 w-32 h-32 rounded-2xl opacity-80"
                style={{ backgroundColor: config.corPrimaria }}
              />
              <img
                src={config.sobreFotoUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80"}
                alt={config.nomeAgencia || 'Sobre a Agência'}
                className="rounded-2xl w-full h-80 object-cover relative z-10 shadow-xl border border-zinc-200 dark:border-zinc-700"
              />
            </div>
          </section>
        );
      }

      // 3. FUNDADORES
      case 'fundadores': {
        const estilo = resolverEstiloSecao(secaoItem);
        return (
          <section 
            id="fundadores"
            key="fundadores" 
            className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 mb-8 border border-zinc-200 dark:border-zinc-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            )}
            <div className="relative order-2 md:order-1 z-10">
              <div className="grid grid-cols-2 gap-3">
                <img
                  src={fundadores.fotoGabrielUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80"}
                  alt={fundadores.gabrielNome || "Liderança"}
                  className="rounded-2xl h-64 w-full object-cover shadow-lg border border-purple-900/30"
                />
                <img
                  src={fundadores.fotoCarolUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80"}
                  alt={fundadores.carolNome || "Liderança"}
                  className="rounded-2xl h-64 w-full object-cover shadow-lg border border-purple-900/30 mt-4"
                />
              </div>
            </div>

            <div className="space-y-4 order-1 md:order-2 z-10">
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
                <span style={{ color: config.corSecundaria }}>Liderança & Sócios</span><br />
                {fundadores.gabrielNome} & {fundadores.carolNome}
              </h2>
              <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                {fundadores.textoApresentacao}
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-xs text-zinc-500 font-semibold">
                {fundadores.instagramGabriel && <span>{fundadores.instagramGabriel}</span>}
                {config.redesSociais?.instagram && (
                  <>
                    <span>•</span>
                    <span>{config.redesSociais.instagram}</span>
                  </>
                )}
                {wppDestino && (
                  <>
                    <span>•</span>
                    <span>{wppDestino}</span>
                  </>
                )}
              </div>
            </div>
          </section>
        );
      }

      // 4. PREMIAÇÃO REGIONAL
      case 'premiacao': {
        const estilo = resolverEstiloSecao(secaoItem, { corFundo: '#47005B', corTexto: '#FFFFFF' });
        return (
          <section 
            id="premiacao"
            key="premiacao" 
            className="relative overflow-hidden text-white rounded-3xl p-8 sm:p-12 mb-8 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center border border-purple-800/60"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/60 pointer-events-none" />
            )}
            <div className="space-y-3 relative z-10">
              <span className="text-xs font-mono font-bold uppercase text-purple-200">{config.nomeAgencia || 'NOSSA AGÊNCIA'}</span>
              <h2 className="text-3xl sm:text-5xl font-black leading-tight">
                {premiacao.titulo}
              </h2>
              <p className="text-sm sm:text-base text-purple-100 leading-relaxed">
                {premiacao.texto}
              </p>
            </div>

            <div className="relative z-10">
              <div className="bg-amber-500 w-16 h-16 rounded-2xl absolute -top-4 -left-4 -z-0 opacity-80" />
              <img
                src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80"
                alt={premiacao.titulo || 'Reconhecimento'}
                className="rounded-2xl shadow-2xl relative z-10 w-full h-64 object-cover"
              />
            </div>
          </section>
        );
      }

      // 5. O TIME & PARCEIROS
      case 'time_parceiros': {
        const estilo = resolverEstiloSecao(secaoItem);
        return (
          <section 
            id="time_parceiros"
            key="time_parceiros" 
            className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 mb-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            )}
            <div className="flex items-center justify-between relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black" style={{ color: config.corSecundaria }}>
                O Time
              </h2>
            </div>

            <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-2xl relative z-10">
              {time.texto}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 relative z-10">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-center">
                <span className="font-black text-blue-600 block text-lg">∞ Meta</span>
                <span className="text-xs font-semibold text-zinc-500">Business Partner</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-center">
                <span className="font-black text-amber-500 block text-lg">Google</span>
                <span className="text-xs font-semibold text-zinc-500">Partner Oficial</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-center">
                <span className="font-black text-emerald-600 block text-lg">Kommo</span>
                <span className="text-xs font-semibold text-zinc-500">Partner CRM</span>
              </div>
            </div>
          </section>
        );
      }

      // 6. NOSSOS SERVIÇOS
      case 'nossos_servicos': {
        const estilo = resolverEstiloSecao(secaoItem);
        return (
          <section 
            id="nossos_servicos"
            key="nossos_servicos" 
            className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 mb-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            )}
            <h2 className="text-3xl sm:text-4xl font-black relative z-10" style={{ color: config.corSecundaria }}>
              Nossos Serviços
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              {servicos.map((srv, srvIdx) => (
                <div key={srv?.id || `srv_${srvIdx}`} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    {srv.titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {srv.descricao}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      }

      // 7. NOSSOS CLIENTES
      case 'nossos_clientes': {
        const estilo = resolverEstiloSecao(secaoItem, { corFundo: '#3D0050', corTexto: '#FFFFFF' });
        return (
          <section 
            id="nossos_clientes"
            key="nossos_clientes" 
            className="relative overflow-hidden text-white rounded-3xl p-8 sm:p-12 mb-8 shadow-xl space-y-6 border border-purple-900"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/60 pointer-events-none" />
            )}
            <div className="text-center max-w-2xl mx-auto space-y-3 relative z-10">
              <h2 className="text-3xl sm:text-5xl font-black">
                Nossos Clientes
              </h2>
              <p className="text-sm sm:text-base text-purple-200 font-medium">
                São a bússola que guia cada estratégia e iniciativa!
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-6 border-t border-purple-800/60 relative z-10">
              {clientes.map((cli, cliIdx) => (
                <div key={cli?.id || `cli_${cliIdx}`} className="p-4 rounded-2xl bg-black/25 backdrop-blur-xs border border-white/10 flex flex-col items-center justify-center min-h-[90px] text-center">
                  {cli.logoUrl ? (
                    <img 
                      src={cli.logoUrl} 
                      alt={cli.nome} 
                      className="h-12 max-w-full object-contain filter brightness-110 drop-shadow-sm mb-1" 
                    />
                  ) : (
                    <div className="font-bold text-xs text-white truncate">{cli.nome}</div>
                  )}
                  <span className="text-[10px] text-purple-300/80 truncate block">{cli.nome}</span>
                </div>
              ))}
            </div>
          </section>
        );
      }

      // 8. TRANSIÇÃO DA PROPOSTA
      case 'transicao_proposta': {
        const estilo = resolverEstiloSecao(secaoItem);
        return (
          <section 
            id="transicao_proposta"
            key="transicao_proposta" 
            className="relative overflow-hidden bg-zinc-100 dark:bg-zinc-900/90 rounded-3xl p-10 sm:p-16 mb-8 text-center border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            )}
            <div className="relative z-10 space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-zinc-400">{config.nomeAgencia || 'PROPOSTA COMERCIAL'}</span>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight" style={{ color: config.corPrimaria }}>
                Proposta Comercial
              </h2>
              <div className="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-zinc-200 pt-2">
                {proposta.clienteNome} • {proposta.clienteEmpresa}
              </div>
              {proposta.clienteSegmento && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                  Segmento: {proposta.clienteSegmento}
                </span>
              )}
            </div>
          </section>
        );
      }

      // 9. PROJETO
      case 'projeto_diagnostico': {
        const estilo = resolverEstiloSecao(secaoItem);
        return (
          <section 
            id="projeto_diagnostico"
            key="projeto_diagnostico" 
            className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 mb-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            )}
            <div className="flex items-center justify-between relative z-10">
              <h2 className="text-3xl sm:text-5xl font-black" style={{ color: config.corSecundaria }}>
                Projeto
              </h2>
            </div>
            <div className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line pt-2 relative z-10">
              {proposta.projetoTexto || proposta.apresentacao}
            </div>
          </section>
        );
      }

      // 10. DESTAQUES CINEMÁTICOS & PARALLAX SCROLLING (SHOWCASE RZN STYLE ADAPTADO À ID DO SISTEMA)
      case 'destaques_parallax': {
        const estilo = resolverEstiloSecao(secaoItem, { corFundo: '#110017', corTexto: '#FFFFFF' });
        const offsetY1 = Math.round((scrollY - 700) * 0.08);
        const offsetY2 = Math.round((scrollY - 950) * -0.06);

        return (
          <section 
            id="destaques_parallax"
            key="destaques_parallax"
            className="relative overflow-hidden rounded-3xl p-6 sm:p-12 mb-8 border border-purple-500/30 shadow-2xl text-white space-y-8"
            style={estilo}
          >
            {/* Esferas de iluminação com translação Parallax */}
            <div 
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none transition-transform duration-100 ease-out"
              style={{ 
                backgroundColor: config.corSecundaria || '#DDA743',
                transform: `translateY(${offsetY1}px)`
              }}
            />
            <div 
              className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none transition-transform duration-100 ease-out"
              style={{ 
                backgroundColor: config.corPrimaria || '#5A0072',
                transform: `translateY(${offsetY2}px)`
              }}
            />

            {/* Cabeçalho da Lâmina Cinemática */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <div 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border shadow-xs"
                  style={{ 
                    backgroundColor: `${config.corSecundaria}22`,
                    borderColor: config.corSecundaria,
                    color: config.corSecundaria
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  Estratégia & Escala de Performance
                </div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  Construção de Autoridade & Resultados
                </h2>
                <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
                  Evolução estruturada para {proposta.clienteEmpresa} com presença digital dominante.
                </p>
              </div>
              <div className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/40 px-3 py-1 rounded-full uppercase tracking-wider">
                ★ EFEITO PARALLAX ATIVO
              </div>
            </div>

            {/* ELEMENTOS DESTAQUE COM PARALLAX SCROLLING */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {/* Card 1 */}
              <div 
                className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2 hover:border-amber-400/50 transition-all duration-300 shadow-xl"
                style={{ transform: `translateY(${Math.max(-24, Math.min(24, offsetY1))}px)` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block">
                    Crescimento Estimado
                  </span>
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  +380%
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Alcance qualificado de novos potenciais clientes e fortalecimento de autoridade no nicho de atuação.
                </p>
              </div>

              {/* Card 2 Destaque Central */}
              <div 
                className="p-6 rounded-3xl bg-linear-to-b from-purple-950/70 to-black/70 border border-purple-500/40 backdrop-blur-md space-y-2 shadow-2xl hover:scale-102 transition-all duration-300"
                style={{ transform: `translateY(${Math.max(-24, Math.min(24, offsetY2))}px)` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 block">
                    Eficiência de Investimento
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: config.corSecundaria }}>
                  4.8x
                </div>
                <p className="text-xs text-purple-100 leading-relaxed">
                  Retorno médio sobre o investimento (ROAS) em campanhas direcionadas de alta conversão.
                </p>
              </div>

              {/* Card 3 */}
              <div 
                className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2 hover:border-amber-400/50 transition-all duration-300 shadow-xl"
                style={{ transform: `translateY(${Math.max(-24, Math.min(24, offsetY1 * 0.7))}px)` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                    Acompanhamento
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  24/7
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Monitoramento contínuo de métricas, otimização de orçamentos e relatórios semanais.
                </p>
              </div>
            </div>

            {/* LINHA DO TEMPO DAS ETAPAS DO PROJETO */}
            <div className="p-6 sm:p-8 rounded-3xl bg-black/40 border border-white/10 space-y-6 relative z-10">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Jornada de Execução em 3 Fases Estratégicas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-purple-900 text-purple-200 font-black text-xs flex items-center justify-center">
                    01
                  </div>
                  <h4 className="font-bold text-sm text-white">Fase 1: Diagnóstico & Setup</h4>
                  <p className="text-xs text-zinc-400">
                    Alinhamento de público-alvo, criação de personas, setup de contas de anúncios e pixel.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/30 text-amber-300 font-black text-xs flex items-center justify-center">
                    02
                  </div>
                  <h4 className="font-bold text-sm text-white">Fase 2: Produção de Alto Impacto</h4>
                  <p className="text-xs text-zinc-400">
                    Gravação com videomaker profissional, roteiros comerciais e design refinado para as redes.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/30 text-emerald-300 font-black text-xs flex items-center justify-center">
                    03
                  </div>
                  <h4 className="font-bold text-sm text-white">Fase 3: Distribuição & Escala</h4>
                  <p className="text-xs text-zinc-400">
                    Tráfego pago no Meta e Google Ads, conversão direta no WhatsApp e reuniões de alinhamento.
                  </p>
                </div>
              </div>
            </div>
          </section>
        );
      }

      // 11. ANÁLISE DAS REDES
      case 'analise_redes': {
        if (!proposta.analiseRedes) return null;
        const estilo = resolverEstiloSecao(secaoItem);
        return (
          <section 
            id="analise_redes"
            key="analise_redes" 
            className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 mb-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            )}
            <div className="flex items-center justify-between relative z-10">
              <h2 className="text-3xl sm:text-5xl font-black" style={{ color: config.corSecundaria }}>
                Análise das Redes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
              <div className="relative text-center">
                <span className="text-xs font-mono font-bold text-zinc-400 block mb-2">PROJEÇÃO ILUSTRATIVA</span>
                <img
                  src={proposta.analiseRedes.perfilMockupUrl || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80'}
                  alt="Análise de Perfil"
                  className="rounded-2xl shadow-xl w-full max-h-96 object-cover border border-zinc-200 dark:border-zinc-700"
                />
              </div>

              <div className="space-y-4">
                <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {proposta.analiseRedes.descricaoDiagnostico}
                </p>

                <div className="pt-2 space-y-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
                    Principais oportunidades de melhoria:
                  </h3>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
                    {(proposta.analiseRedes.oportunidadesMelhoria || []).map((op, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                        <span>{op}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        );
      }

      // 11. GESTÃO DE REDES
      case 'gestao_redes': {
        if (!proposta.modulos?.gestaoRedes?.ativo) return null;
        const gRedes = proposta.modulos.gestaoRedes;
        const estilo = resolverEstiloSecao(secaoItem, { corFundo: '#3A004C', corTexto: '#FFFFFF' });
        return (
          <section 
            id="gestao_redes"
            key="gestao_redes" 
            className="relative overflow-hidden text-white rounded-3xl p-8 sm:p-12 mb-8 shadow-xl border border-purple-900 space-y-6"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/60 pointer-events-none" />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-800/60 pb-6 relative z-10">
              <div>
                <span className="text-xs font-mono font-bold text-purple-200">{config.nomeAgencia || 'SERVIÇOS DIGITAIS'}</span>
                <h2 className="text-3xl sm:text-5xl font-black mt-1">
                  Gestão de Redes
                </h2>
                <div className="text-xs text-amber-300 font-bold mt-1">
                  {(gRedes.redesAtendidas || ['Instagram', 'Facebook']).join(', ')}
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-white/10 text-xs">
                Plano mensal + R$ {gRedes.verbaImpulsionamentoMensal || 300},00 mensal de impulsionamento
              </div>
            </div>

            <div className="space-y-4 text-sm sm:text-base relative z-10">
              <div className="font-bold text-purple-200">Com a gestão completa, você terá:</div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Conteúdo toda semana:</strong> {gRedes.postsPorSemana}, incluindo {gRedes.videosProfissionaisMes} Vídeos profissionais por mês, {gRedes.artesMes} artes e {gRedes.fotosMes} fotos.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <Video className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Gravação com Videomaker:</strong> {gRedes.videomakerVisita}
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Postagens Estratégicas:</strong> {gRedes.postagensEstrategicas}
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-red-950/40 p-4 rounded-2xl border border-red-500/30 text-red-200 text-xs sm:text-sm">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>🚫 O que não está incluso:</strong> {gRedes.naoIncluso}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      }

      // 12. META ADS
      case 'meta_ads': {
        if (!proposta.modulos?.metaAds?.ativo) return null;
        const meta = proposta.modulos.metaAds;
        const estilo = resolverEstiloSecao(secaoItem);
        return (
          <section 
            id="meta_ads"
            key="meta_ads" 
            className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 mb-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 relative z-10">
              <div>
                <span className="text-xs font-bold font-mono text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                  {meta.chamadaDestaque}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white mt-1">
                  <span style={{ color: config.corSecundaria }}>Anúncios,</span> Meta ADS
                </h2>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/40 px-4 py-2.5 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300">
                R$ {meta.verbaSugeridaDiaria},00 por dia em anúncios
              </div>
            </div>

            <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed relative z-10">
              {meta.descricao}
            </p>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-2 relative z-10">
              <div className="text-xs font-bold uppercase text-zinc-500">Entregáveis Inclusos:</div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                {(meta.entregaveis || []).map((ent, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{ent}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      }

      // 13. GOOGLE ADS
      case 'google_ads': {
        if (!proposta.modulos?.googleAds?.ativo) return null;
        const gads = proposta.modulos.googleAds;
        const estilo = resolverEstiloSecao(secaoItem);
        return (
          <section 
            id="google_ads"
            key="google_ads" 
            className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 mb-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 relative z-10">
              <div>
                <span className="text-xs font-bold font-mono text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                  {gads.chamadaDestaque}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white mt-1">
                  <span style={{ color: config.corSecundaria }}>Anúncios,</span> Google ADS
                </h2>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-300">
                R$ {gads.verbaSugeridaDiaria},00 por dia em anúncios
              </div>
            </div>

            <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed relative z-10">
              {gads.descricao}
            </p>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-2 relative z-10">
              <div className="text-xs font-bold uppercase text-zinc-500">Entregáveis Inclusos:</div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                {(gads.entregaveis || []).map((ent, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{ent}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      }

      // 14. SITE INSTITUCIONAL
      case 'site_institucional': {
        if (!proposta.modulos?.site?.ativo) return null;
        const site = proposta.modulos.site;
        const estilo = resolverEstiloSecao(secaoItem);
        return (
          <section 
            id="site_institucional"
            key="site_institucional" 
            className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 mb-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            )}
            <h2 className="text-3xl sm:text-5xl font-black relative z-10" style={{ color: config.corSecundaria }}>
              Site Institucional
            </h2>
            <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed relative z-10">
              {site.descricao}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 relative z-10">
              {(site.entregaveis || []).map((ent, i) => (
                <div key={i} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{ent}</span>
                </div>
              ))}
            </div>
          </section>
        );
      }

      // 15. INVESTIMENTO
      case 'investimento_planos': {
        const valorDe = proposta.precoDe ?? proposta.valorTotal ?? 2500;
        const valorPor = proposta.precoPor ?? (proposta.valorTotal - (proposta.descontoAplicado || 0));
        const estilo = resolverEstiloSecao(secaoItem, { corFundo: '#3D0050', corTexto: '#FFFFFF' });
        return (
          <section 
            id="investimento_planos"
            key="investimento_planos" 
            className="relative overflow-hidden text-white rounded-3xl p-8 sm:p-14 mb-8 shadow-2xl border border-purple-800/80 space-y-8"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/60 pointer-events-none" />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-800/60 pb-6 relative z-10">
              <h2 className="text-3xl sm:text-5xl font-black">
                Investimento
              </h2>
              <span className="text-xs font-mono text-purple-200">{config.nomeAgencia || 'CONDIÇÕES COMERCIAIS'}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
              <div className="space-y-4">
                {valorDe > valorPor && (
                  <div className="text-2xl sm:text-4xl font-black text-amber-300/70 line-through">
                    De: {formatarMoeda(valorDe)}
                  </div>
                )}

                <div className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight" style={{ color: '#FFB800' }}>
                  POR: {formatarMoeda(valorPor)}
                </div>

                <p className="text-xs text-purple-200">
                  + verba direta de anúncios a partir do início das campanhas
                </p>

                {proposta.condicaoPrimeiraMensalidade && (
                  <div className="bg-amber-400/20 border border-amber-400/40 p-4 rounded-2xl text-amber-200 font-bold text-sm sm:text-base leading-snug">
                    {proposta.condicaoPrimeiraMensalidade}
                  </div>
                )}
              </div>

              {proposta.bonusInclusos && proposta.bonusInclusos.length > 0 && (
                <div className="bg-black/30 backdrop-blur-sm p-6 rounded-3xl border border-white/10 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Diferenciais e Suporte Incluso:
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-zinc-200 leading-relaxed">
                    {proposta.bonusInclusos.map((bonus, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{bonus}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        );
      }

      // 16. DADOS BANCÁRIOS & PIX
      case 'dados_pagamento': {
        const estilo = resolverEstiloSecao(secaoItem);
        return (
          <section 
            id="dados_pagamento"
            key="dados_pagamento" 
            className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 mb-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            )}
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 relative z-10">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Faturamento & Chave PIX Oficial
            </h2>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm font-mono text-zinc-800 dark:text-zinc-200 select-all relative z-10">
              {config.dadosBancariosPix}
            </div>
          </section>
        );
      }

      // 17. GARANTIAS & TERMOS
      case 'garantias_termos': {
        const estilo = resolverEstiloSecao(secaoItem);
        return (
          <section 
            id="garantias_termos"
            key="garantias_termos" 
            className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 mb-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            )}
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 relative z-10">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              Cláusulas de Garantia & Acordo de Confidencialidade
            </h2>
            <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed relative z-10">
              {config.termosGarantia}
            </div>
          </section>
        );
      }

      // 18. FECHAMENTO & BOTÃO WHATSAPP DO CONSULTOR
      case 'aceite_fechamento': {
        const estilo = resolverEstiloSecao(secaoItem);
        return (
          <section 
            id="aceite_fechamento"
            key="aceite_fechamento" 
            className="relative overflow-hidden bg-zinc-100 dark:bg-zinc-900/90 rounded-3xl p-8 sm:p-16 mb-8 text-center border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-6"
            style={estilo}
          >
            {secaoItem.estilo?.imagemFundoUrl && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            )}
            <div className="space-y-2 relative z-10">
              <span className="text-xs font-mono font-bold uppercase text-zinc-400">{config.nomeAgencia || 'PROPOSTA COMERCIAL'}</span>
              <h2 className="text-4xl sm:text-6xl font-black text-purple-950 dark:text-purple-300">
                Obrigado!
              </h2>
              <div className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                {proposta.clienteNome}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-4 relative z-10">
              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageSquare className="w-5 h-5" />
                Conversar no WhatsApp
              </a>

              {!propostaAceitaLocal ? (
                <button
                  type="button"
                  onClick={() => setModalAceiteAberto(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  style={{ backgroundColor: config.corPrimaria }}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Aprovar Proposta
                </button>
              ) : (
                <div className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-md">
                  <Check className="w-5 h-5" />
                  Proposta Aceita Formalmente
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-500 font-semibold gap-2 relative z-10">
              <span>{consultorDestino}</span>
              {config.redesSociais?.website && <span>{config.redesSociais.website}</span>}
              {config.redesSociais?.instagram && <span>{config.redesSociais.instagram}</span>}
              {wppDestino && <span>{wppDestino}</span>}
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  // RENDERIZAÇÃO COMPLETA: SEÇÕES CUSTOMIZADAS + SEÇÕES NATIVAS COM WIDGETS EXTRAS
  const renderSecao = (secaoItem: SecaoConfiguravel) => {
    if (!secaoItem.ativo) return null;

    // SEÇÃO CUSTOMIZADA (100% PERSONALIZADA PELO USUÁRIO)
    if (secaoItem.tipo === 'customizada') {
      const estilo = resolverEstiloSecao(secaoItem);
      const temImagem = Boolean(secaoItem.estilo?.imagemFundoUrl);

      return (
        <section 
          id={secaoItem.id}
          key={secaoItem.id} 
          className="relative overflow-hidden rounded-3xl p-6 sm:p-10 mb-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6"
          style={estilo}
        >
          {temImagem && (
            <div className={`absolute inset-0 pointer-events-none ${secaoItem.estilo?.overlayEscuro ? 'bg-black/75' : 'bg-black/40'} backdrop-blur-[1px]`} />
          )}

          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl font-black mt-1">
              {secaoItem.titulo}
            </h2>
            {secaoItem.descricao && (
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {secaoItem.descricao}
              </p>
            )}
          </div>

          <div className="space-y-6 relative z-10">
            {(secaoItem.linhas || []).map((linha, lIdx) => (
              <div 
                key={linha?.id || `linha_${lIdx}`}
                className={`grid gap-6 ${
                  linha.qtdColunas === 1 ? 'grid-cols-1' :
                  linha.qtdColunas === 2 ? 'grid-cols-1 md:grid-cols-2' :
                  linha.qtdColunas === 3 ? 'grid-cols-1 md:grid-cols-3' :
                  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                }`}
              >
                {(linha.colunas || []).map((col, cIdx) => (
                  <div 
                    key={col?.id || `col_${cIdx}`} 
                    className={
                      col.direcao === 'horizontal'
                        ? 'flex flex-row flex-wrap items-start gap-4'
                        : 'flex flex-col gap-3'
                    }
                  >
                    {(col.widgets || []).map((w, wIdx) => (
                      <div 
                        key={w?.id || `w_${wIdx}`}
                        className={col.direcao === 'horizontal' ? 'flex-1 min-w-[220px]' : 'w-full'}
                      >
                        {renderWidget(w)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      );
    }

    const nativo = renderSecaoNativa(secaoItem);
    if (!nativo) return null;

    if (secaoItem.linhas && secaoItem.linhas.length > 0) {
      return (
        <div key={secaoItem.id} className="space-y-4 mb-8">
          {nativo}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="space-y-6">
              {secaoItem.linhas.map((linha, lIdx) => (
                <div 
                  key={linha?.id || `extra_l_${lIdx}`}
                  className={`grid gap-6 ${
                    linha.qtdColunas === 1 ? 'grid-cols-1' :
                    linha.qtdColunas === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    linha.qtdColunas === 3 ? 'grid-cols-1 md:grid-cols-3' :
                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                  }`}
                >
                  {(linha.colunas || []).map((col, cIdx) => (
                    <div 
                      key={col?.id || `extra_c_${cIdx}`} 
                      className={
                        col.direcao === 'horizontal'
                          ? 'flex flex-row flex-wrap items-start gap-4'
                          : 'flex flex-col gap-3'
                      }
                    >
                      {(col.widgets || []).map((w, wIdx) => (
                        <div 
                          key={w?.id || `extra_w_${wIdx}`}
                          className={col.direcao === 'horizontal' ? 'flex-1 min-w-[220px]' : 'w-full'}
                        >
                          {renderWidget(w)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return nativo;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 antialiased selection:bg-purple-500 selection:text-white pb-24 relative">
      
      {/* BARRA SUPERIOR DE VALIDADE & SEGURANÇA */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-all">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Proposta Válida
            </span>
            <span className="hidden sm:inline font-mono text-[10px] text-zinc-400">
              HASH: {(proposta.token || '').substring(0, 12)}...
            </span>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 px-3 py-1 rounded-full text-xs font-medium text-amber-900 dark:text-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>
              Expira em: <strong className="font-semibold">{tempoRestante.dias}d {tempoRestante.horas}h {tempoRestante.minutos}m</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!propostaAceitaLocal ? (
              <button
                type="button"
                onClick={() => setModalAceiteAberto(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 transition-all cursor-pointer"
                style={{ backgroundColor: config.corPrimaria }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aprovar Proposta
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                Aprovada
              </span>
            )}
          </div>
        </div>
      </header>

      {/* MENU FLUTUANTE DE ÂNCORAS NO CANTO DIREITO (QUADRADINHOS PEQUENOS SEM NÚMEROS) */}
      <nav 
        aria-label="Navegação rápida pelas seções"
        className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-2 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl"
      >
        {secoesOrdem.filter(s => s.ativo && s.mostrarNoMenuFlutuante !== false).map((secao) => {
          const isAtivo = secaoAtivaId === secao.id;
          return (
            <button
              key={secao.id}
              type="button"
              onClick={() => {
                const el = document.getElementById(secao.id);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                  setSecaoAtivaId(secao.id);
                }
              }}
              className="relative group p-1 flex items-center justify-center cursor-pointer transition-all focus:outline-none"
              title={secao.titulo}
              aria-label={`Ir para seção ${secao.titulo}`}
            >
              <span 
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2.5px] transition-all duration-300 block ${
                  isAtivo 
                    ? 'scale-125 shadow-md ring-2 ring-purple-400 dark:ring-purple-500' 
                    : 'bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-500 hover:scale-110'
                }`}
                style={{ 
                  backgroundColor: isAtivo ? (config.corPrimaria || '#5A0072') : undefined 
                }}
              />
              
              {/* Tooltip com o título da seção ao passar o mouse */}
              <div className="absolute right-7 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center pointer-events-none z-50">
                <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap border border-zinc-700 dark:border-zinc-300">
                  {secao.titulo}
                </div>
                <div className="w-1.5 h-1.5 bg-zinc-900 dark:bg-zinc-100 rotate-45 -mr-1" />
              </div>
            </button>
          );
        })}
      </nav>

      {/* CONTEÚDO PRINCIPAL RENDERIZADO */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {secoesOrdem.map((secao, sIdx) => (
          <React.Fragment key={secao?.id || `secao_ordem_${sIdx}`}>
            {renderSecao(secao)}
          </React.Fragment>
        ))}

        {/* LÂMINAS DE SERVIÇOS EXTRAS CUSTOMIZADOS */}
        {proposta.modulos?.outrosServicos && proposta.modulos.outrosServicos.length > 0 && (
          <div className="space-y-8 mb-8">
            {proposta.modulos.outrosServicos.map((srv, srvIdx) => (
              <section 
                id={srv?.id || `extra_srv_${srvIdx}`}
                key={srv?.id || `extra_srv_${srvIdx}`} 
                className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    {srv.chamadaDestaque && (
                      <span className="text-xs font-bold font-mono text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                        {srv.chamadaDestaque}
                      </span>
                    )}
                    <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white mt-1">
                      {srv.titulo}
                    </h2>
                  </div>

                  {srv.valorMensal && (
                    <div className="bg-purple-50 dark:bg-purple-950/40 px-4 py-2.5 rounded-2xl border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300">
                      Investimento Adicional: {formatarMoeda(srv.valorMensal)}/mês
                    </div>
                  )}
                </div>

                <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {srv.descricao}
                </p>

                {srv.entregaveis && srv.entregaveis.length > 0 && (
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <div className="text-xs font-bold uppercase text-zinc-500">Entregáveis:</div>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                      {srv.entregaveis.map((ent, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{ent}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {/* RODAPÉ OFICIAL & CRÉDITO DESIGNER VIP */}
        <footer className="mt-16 pt-8 pb-12 border-t border-zinc-200 dark:border-zinc-800 text-center space-y-3">
          {config.textoRodape && (
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto px-4 whitespace-pre-line leading-relaxed">
              {config.textoRodape}
            </p>
          )}
          <div className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1.5 pt-2">
            <span>@2026. Desenvolvido por</span>
            <a 
              href="https://www.designervip.com.br" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-bold hover:underline hover:text-purple-600 dark:hover:text-purple-400 transition-colors inline-flex items-center gap-0.5 text-purple-700 dark:text-purple-400"
            >
              <span>Designer Vip</span>
              <ExternalLink className="w-3 h-3 inline ml-0.5" />
            </a>
          </div>
        </footer>
      </main>

      {/* DISCRETO BOTÃO FLUTUANTE PARA RETORNAR AO PAINEL (CASO SEJA O ADMIN/CONSULTOR) */}
      {onVoltarParaPainel && (
        <button
          type="button"
          onClick={onVoltarParaPainel}
          className="fixed bottom-4 right-4 z-40 bg-zinc-900/90 dark:bg-white/90 text-white dark:text-zinc-900 px-4 py-2 rounded-full text-xs font-bold shadow-xl hover:scale-105 transition-transform backdrop-blur-sm flex items-center gap-1.5 opacity-70 hover:opacity-100"
          title="Acesso rápido ao Painel Administrativo"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Painel Comercial</span>
        </button>
      )}

      {/* MODAL DE ACEITE DIGITAL */}
      {modalAceiteAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-2">
              Aprovação Formal da Proposta
            </h3>
            <p className="text-xs text-zinc-500 mb-6">
              Ao confirmar, você formaliza a aceitação do escopo e condições comerciais da <strong className="text-zinc-800 dark:text-zinc-200">{config.nomeAgencia}</strong>.
            </p>

            <form onSubmit={handleConfirmarAceite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1">
                  Nome Completo do Responsável Legal
                </label>
                <input
                  type="text"
                  required
                  value={nomeAssinante}
                  onChange={e => setNomeAssinante(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1">
                  Cargo / Função na Empresa
                </label>
                <input
                  type="text"
                  required
                  value={cargoAssinante}
                  onChange={e => setCargoAssinante(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="termo"
                  checked={termoAceito}
                  onChange={e => setTermoAceito(e.target.checked)}
                  className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                  required
                />
                <label htmlFor="termo" className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug cursor-pointer select-none">
                  Declaro que li e concordo com o escopo, prazos e condições financeiras acordadas nesta proposta comercial.
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalAceiteAberto(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!termoAceito}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: config.corPrimaria }}
                >
                  Confirmar Aceite Digital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
