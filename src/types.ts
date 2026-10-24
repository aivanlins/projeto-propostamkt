export type StatusProposta = 'rascunho' | 'ativo' | 'inativo' | 'expirado' | 'aceito' | 'recusado';

export interface ItemEntregavel {
  id: string;
  titulo: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  prazoEstimado: string;
  categoria?: string;
}

export interface AnaliseRedes {
  perfilMockupUrl?: string;
  descricaoDiagnostico: string;
  oportunidadesMelhoria: string[];
}

export interface ModuloGestaoRedes {
  ativo: boolean;
  titulo: string;
  postsPorSemana: string;
  videosProfissionaisMes: number;
  artesMes: number;
  fotosMes: number;
  videomakerVisita: string;
  postagensEstrategicas: string;
  naoIncluso: string;
  redesAtendidas: string[];
  valorMensal: number;
  verbaImpulsionamentoMensal?: number;
}

export interface ModuloMidiaAds {
  ativo: boolean;
  titulo: string;
  plataforma: 'Meta Ads' | 'Google Ads';
  chamadaDestaque: string; // Ex: "AQUI É ONDE SUA EMPRESA FAZ DINHEIRO"
  descricao: string;
  verbaSugeridaDiaria: number;
  entregaveis: string[];
}

export interface ModuloSite {
  ativo: boolean;
  titulo: string;
  chamadaDestaque: string;
  descricao: string;
  entregaveis: string[];
  valor?: number;
}

export interface ServicoCustomizado {
  id: string;
  ativo: boolean;
  titulo: string;
  chamadaDestaque?: string;
  descricao: string;
  valorMensal?: number;
  entregaveis: string[];
}

export interface ModulosProposta {
  gestaoRedes?: ModuloGestaoRedes;
  metaAds?: ModuloMidiaAds;
  googleAds?: ModuloMidiaAds;
  site?: ModuloSite;
  outrosServicos?: ServicoCustomizado[];
}

// ==========================================
// WIDGETS & SEÇÕES ESTILO ELEMENTOR PRO
// ==========================================

export type TipoWidget = 'titulo' | 'texto' | 'imagem' | 'lista' | 'botao' | 'divisor' | 'box' | 'tabela';

export interface CelulaTabela {
  linha: number;
  coluna: number;
  tipo: 'texto' | 'imagem';
  texto?: string;
  urlImagem?: string;
  alinhamento?: 'left' | 'center' | 'right';
}

export interface ConteudoWidget {
  texto?: string;
  subtexto?: string;
  tamanho?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  alinhamento?: 'left' | 'center' | 'right';
  cor?: string;
  corTexto?: string;
  urlImagem?: string;
  altImagem?: string;
  alturaImagemPx?: number;
  orientacaoLista?: 'vertical' | 'horizontal';
  itensLista?: string[];
  orientacaoDivisor?: 'horizontal' | 'vertical';
  espessuraDivisorPx?: number;
  corDivisor?: string;
  urlBotao?: string;
  textoBotao?: string;

  // Widget: Box (card estilizado similar aos boxes de serviços)
  tituloBox?: string;
  tagDestaque?: string;
  textoBox?: string;
  iconeBox?: string;
  corFundoBox?: string;
  corBordaBox?: string;
  corTextoBox?: string;

  // Widget: Tabela (linhas, colunas, espessura da borda com widgets de texto/imagem internos)
  linhasTabela?: number;
  colunasTabela?: number;
  espessuraBorda?: number; // 0 = sem borda, 1 = 1px, 2 = 2px, etc.
  corBorda?: string;
  celulasTabela?: CelulaTabela[];
}

export interface WidgetItem {
  id: string;
  tipo: TipoWidget;
  conteudo: ConteudoWidget;
}

export interface ColunaSecao {
  id: string;
  larguraSpan?: number; // 1 a 12 (grid de colunas)
  direcao?: 'vertical' | 'horizontal'; // 'vertical' (empilhado) ou 'horizontal' (lado a lado)
  widgets: WidgetItem[];
}

export interface LinhaSecao {
  id: string;
  qtdColunas: number; // 1, 2, 3 ou 4 colunas
  colunas: ColunaSecao[];
}

export interface SecaoConfiguravel {
  id: string;
  titulo: string;
  descricao: string;
  ativo: boolean;
  tipo: 'fixo' | 'dinamico_proposta' | 'customizada';
  podeEditar?: boolean; // Controlado pelo Admin
  mostrarNoMenuFlutuante?: boolean; // Se deve ou não aparecer nos quadradinhos flutuantes laterais
  estilo?: {
    corFundo?: string;
    imagemFundoUrl?: string;
    corTexto?: string;
    paddingY?: 'sm' | 'md' | 'lg' | 'xl';
    overlayEscuro?: boolean;
  };
  linhas?: LinhaSecao[];
  widgetsExtras?: WidgetItem[]; // Widgets adicionais adicionados nas seções nativas 2 a 8
}

export interface ModeloSecoesSalvo {
  id: string;
  nome: string;
  descricao?: string;
  criadoEm: string;
  secoes: SecaoConfiguravel[];
}

export interface ItemRodapeCapa {
  id: string;
  texto: string;
  link?: string;
}

export interface ConfiguracaoCapa {
  corFundo: string;
  imagemFundoUrl?: string;
  logoUrl?: string;
  titulo: string;
  subtitulo: string;
  ano: string;
  marcaDaguaTexto: string;
  itensRodape: ItemRodapeCapa[];
}

export interface ClienteLogoItem {
  id: string;
  nome: string;
  categoria?: string;
  logoUrl?: string; // Logo com altura uniforme de 48px
}

export interface Proposta {
  id: string;
  token: string; // Hash seguro para URL pública
  slug?: string; // URL amigável: /proposta-<slug>
  titulo: string;
  clienteNome: string;
  clienteEmpresa: string;
  clienteEmail: string;
  clienteTelefone: string;
  clienteDocumento: string; // CNPJ ou CPF
  clienteSegmento?: string; // Ex: Odontologia, Pré-Militar, E-commerce, Investimentos
  clienteInstagram?: string; // Ex: @estevesebueno, @preparatorioteslapinda

  // Seções estruturais da Proposta
  projetoTexto: string; // Texto específico da lâmina "Projeto"
  analiseRedes?: AnaliseRedes; // Lâmina "Análise das Redes"
  modulos?: ModulosProposta; // Lâminas "Gestão de Redes", "Meta Ads", "Google Ads", "Site", outros serviços

  // Informações financeiras (De / Por / Condição Especial)
  precoDe: number; // Ex: R$ 2.500,00 (riscado)
  precoPor: number; // Ex: R$ 1.500,00 (destaque)
  condicaoPrimeiraMensalidade?: string; // Ex: "Até dia 25 de Agosto a primeira mensalidade fica por R$ 1.000,00."
  bonusInclusos?: string[]; // Ex: Treinamento da equipe de vendas, reuniões semanais

  // Seções customizadas específicas desta proposta (não altera outras nem o admin)
  secoesPersonalizadas?: SecaoConfiguravel[];

  // Campos padrão complementares
  apresentacao: string;
  objetivos: string[];
  entregaveis: ItemEntregavel[];
  valorTotal: number;
  descontoAplicado: number;
  condicoesPagamento: string;
  parcelamentoMax: number;
  dataEmissao: string; // ISO string
  dataValidade: string; // ISO string
  status: StatusProposta;
  visualizacoes: number;
  ultimoAcesso?: string;
  ipUltimoAcesso?: string;
  criadoPor: string;
  criadoPorId: string;
  criadoPorWhatsapp: string; // O botão de WhatsApp na proposta usa este número
  criadoEm: string;
  atualizadoEm: string;
  aceiteData?: string;
  aceiteResponsavel?: string;
  observacoesFinais?: string;
}

export interface ConfiguracaoFixa {
  id: string;
  // SMTP opcional (recuperação de senha)
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  nomeAgencia: string;
  slogan: string;
  cnpj: string;
  emailContato: string;
  telefoneWhatsapp: string;
  endereco: string;
  logoUrl: string;
  corPrimaria: string;
  corSecundaria: string;
  termosGarantia: string;
  dadosBancariosPix: string;
  textoRodape: string;
  
  // Customização da Capa Oficial
  capa: ConfiguracaoCapa;

  // Seções institucionais editáveis
  sobreAgencia: string;
  sobreFotoUrl?: string;
  fundadores: {
    gabrielNome: string;
    carolNome: string;
    textoApresentacao: string;
    instagramGabriel: string;
    fotoGabrielUrl: string;
    fotoCarolUrl: string;
  };
  premiacao: {
    titulo: string;
    texto: string;
    anos: string;
    votos: string;
  };
  time: {
    texto: string;
    parceiros: string[]; // Ex: Meta Business Partner, Google Partner, Kommo partner
  };
  servicosInstitucionais: {
    id: string;
    titulo: string;
    descricao: string;
    icone?: string;
  }[];
  clientesApresentados: ClienteLogoItem[];

  // Ordem e Visibilidade das Seções Globais (Padrão definido pelo Admin)
  secoesOrdem: SecaoConfiguravel[];

  // Permissões do comercial
  usuarioComercialPodeCriarSecoes: boolean;

  // Modelos e Presets de Seções Salvos
  modelosSecoes?: ModeloSecoesSalvo[];

  redesSociais: {
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
  atualizadoEm: string;
}

export type PapelUsuario = 'admin' | 'comercial';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  whatsapp: string; // Contato WhatsApp individual do comercial
  cargo?: string; // Cargo na empresa (ex: Diretor Comercial, Especialista em Performance)
  fotoUrl?: string; // Foto de perfil
  slug?: string; // Slug para link de compartilhamento (ex: gabriel-caldas)
  papel: PapelUsuario;
  status: 'ativo' | 'bloqueado';
  ultimoLogin?: string;
  podeCriarSecoes?: boolean;
}

export interface LogAuditoria {
  id: string;
  propostaId?: string;
  propostaTitulo?: string;
  usuarioNome: string;
  acao: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'ATIVACAO' | 'DESATIVACAO' | 'VISUALIZACAO' | 'EXPIRACAO_BLOQUEIO' | 'ACEITE_CLIENTE' | 'ENVIO_EMAIL';
  detalhes: string;
  ip: string;
  userAgent: string;
  dataHora: string;
  statusSeguranca: 'OK' | 'ALERTA' | 'BLOQUEIO';
}

export interface NotificacaoEmail {
  id: string;
  propostaId: string;
  propostaTitulo: string;
  destinatarioNome: string;
  destinatarioEmail: string;
  assunto: string;
  corpo: string;
  statusEnvio: 'enviado' | 'entregue' | 'falha';
  dataEnvio: string;
  tokenProposta: string;
}

export interface EstadoInstalacao {
  instalado: boolean;
  dataInstalacao?: string;
  hostBd?: string;
  nomeBd?: string;
  usuarioAdmin?: string;
  emailAdmin?: string;
  versaoPhpDetectada: string;
  travasSegurancaAtivas: boolean;
}

export interface PopupFeedback {
  tipo: 'sucesso' | 'erro';
  titulo: string;
  mensagem: string;
  aberto: boolean;
}
