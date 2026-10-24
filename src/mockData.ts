import { Proposta, ConfiguracaoFixa, Usuario, LogAuditoria, EstadoInstalacao, NotificacaoEmail } from './types';

const agora = new Date();

function adicionarDias(dias: number): string {
  const d = new Date(agora);
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

function subtrairDias(dias: number): string {
  const d = new Date(agora);
  d.setDate(d.getDate() - dias);
  return d.toISOString();
}

export const ESTADO_INSTALACAO_INICIAL: EstadoInstalacao = {
  instalado: false,
  dataInstalacao: '',
  hostBd: 'localhost',
  nomeBd: '',
  usuarioAdmin: '',
  emailAdmin: '',
  versaoPhpDetectada: 'Node.js / cPanel Linux',
  travasSegurancaAtivas: true,
};

export const USUARIOS_INICIAIS: Usuario[] = [
  {
    id: 'usr_admin',
    nome: 'Administrador Geral',
    email: 'admin@suaagencia.com.br',
    senha: '',
    whatsapp: '+55 11 99999-9999',
    cargo: 'Diretor Geral',
    fotoUrl: '',
    slug: 'admin',
    papel: 'admin',
    status: 'ativo',
    ultimoLogin: agora.toISOString(),
    podeCriarSecoes: true,
  }
];

export const CONFIGURACAO_FIXA_INICIAL: ConfiguracaoFixa = {
  id: 'cfg_principal',
  nomeAgencia: 'Minha Agência',
  slogan: 'Estratégias de Alto Impacto, Branding e Performance Escalável',
  cnpj: '',
  emailContato: 'contato@suaagencia.com.br',
  telefoneWhatsapp: '+55 11 99999-9999',
  endereco: 'Brasil',
  logoUrl: '',
  corPrimaria: '#4F46E5',
  corSecundaria: '#0EA5E9',
  termosGarantia: `1. Todos os entregáveis contratados serão executados conforme as especificações detalhadas nesta proposta comercial.
2. Garantia de SLA e alinhamento de métricas através de reuniões e relatórios periódicos de desempenho.
3. Propriedade Intelectual e acessos operacionais integralmente concedidos ao cliente após o cumprimento das etapas acordadas.
4. Acordo de Confidencialidade (NDA) rigoroso protegendo todos os dados, materiais estratégicos e diretrizes de negócios.`,
  dadosBancariosPix: 'Chave PIX: financeiro@suaagencia.com.br | Titular: Agência de Marketing Digital',
  textoRodape: 'Documento confidencial emitido pela agência. Todos os direitos reservados.',
  
  // Customização profunda da Capa Oficial (Slide 1)
  capa: {
    corFundo: '#18181B',
    imagemFundoUrl: '',
    logoUrl: '',
    titulo: 'PROPOSTA COMERCIAL',
    subtitulo: 'Soluções Estratégicas e Aceleração de Resultados para o seu Negócio',
    ano: '2026',
    marcaDaguaTexto: 'proposta comercial',
    itensRodape: [
      { id: 'item_1', texto: 'Comercial & Novos Negócios' },
      { id: 'item_2', texto: 'contato@suaagencia.com.br' },
    ],
  },

  // Seções Institucionais
  sobreAgencia: 'Nossa agência nasceu com a missão de atender empresas que buscam diferenciação estratégica e crescimento sustentável no mercado digital. Nosso foco é gerar resultados concretos com atendimento consultivo e metodologia comprovada.',
  sobreFotoUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
  fundadores: {
    gabrielNome: 'Diretor Executivo',
    carolNome: 'Diretora de Operações',
    textoApresentacao: 'Nossa liderança é formada por profissionais com sólida experiência em estratégia corporativa, marketing de performance e design. Acreditamos que parcerias sólidas se constroem com transparência, inovação contínua e foco em resultados.',
    instagramGabriel: '',
    fotoGabrielUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    fotoCarolUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
  },
  premiacao: {
    titulo: 'Excelência em Resultados',
    texto: 'Reconhecimento comprovado pelo mercado e excelência na entrega de projetos e crescimento de contas gerenciadas.',
    anos: '2024 e 2025',
    votos: '+98% Satisfação',
  },
  time: {
    texto: 'Time multidisciplinar comprometido com alta performance e constante atualização com as melhores ferramentas e tecnologias do mercado digital.',
    parceiros: ['Google Partner', 'Meta Business Partner', 'HubSpot'],
  },
  servicosInstitucionais: [
    {
      id: 'srv_1',
      titulo: 'Gestão de Redes Sociais',
      descricao: 'Gerenciamento de presença digital nas principais plataformas com estratégia, calendário editorial e criativos de alta qualidade.',
    },
    {
      id: 'srv_2',
      titulo: 'Tráfego Pago & Mídia de Performance',
      descricao: 'Campanhas focadas em atração de público qualificado, captação de leads e aumento de receita.',
    },
    {
      id: 'srv_3',
      titulo: 'Desenvolvimento Web & Landing Pages',
      descricao: 'Sites institucionais, e-commerces e páginas de alta conversão estruturados para velocidade e SEO.',
    },
    {
      id: 'srv_4',
      titulo: 'Branding & Identidade Visual',
      descricao: 'Construção e reposicionamento de marcas para gerar autoridade imediata e percepção de valor superior.',
    },
  ],
  clientesApresentados: [
    { id: 'cli_1', nome: 'Empresa Parceira 1', categoria: 'Educação', logoUrl: '' },
    { id: 'cli_2', nome: 'Empresa Parceira 2', categoria: 'Saúde & Beleza', logoUrl: '' },
    { id: 'cli_3', nome: 'Empresa Parceira 3', categoria: 'Tecnologia', logoUrl: '' },
    { id: 'cli_4', nome: 'Empresa Parceira 4', categoria: 'Varejo', logoUrl: '' },
  ],

  // Permissões de seções do sistema
  usuarioComercialPodeCriarSecoes: true,

  // Seções com suporte a controle do Admin sobre edição
  secoesOrdem: [
    { id: 'hero_capa', titulo: '1. Capa Oficial da Proposta', descricao: 'Logo, título institucional e informações de abertura', ativo: true, tipo: 'fixo', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'sobre_agencia', titulo: '2. Sobre a Nossa Agência', descricao: 'Missão institucional, diferenciais e foco em resultados', ativo: true, tipo: 'fixo', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'fundadores', titulo: '3. Apresentação da Liderança', descricao: 'Sócios e diretores responsáveis pela agência', ativo: true, tipo: 'fixo', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'premiacao', titulo: '4. Reconhecimento & Cases de Sucesso', descricao: 'Destaques e credibilidade de mercado', ativo: true, tipo: 'fixo', podeEditar: false, mostrarNoMenuFlutuante: true },
    { id: 'time_parceiros', titulo: '5. Time & Parceiros Oficiais', descricao: 'Selos de parceiros e capacitação técnica da equipe', ativo: true, tipo: 'fixo', podeEditar: false, mostrarNoMenuFlutuante: true },
    { id: 'nossos_servicos', titulo: '6. Nossos Serviços', descricao: 'Pilares de atuação e entregáveis da agência', ativo: true, tipo: 'fixo', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'nossos_clientes', titulo: '7. Nossos Clientes & Portfólio', descricao: 'Muro de marcas e empresas atendidas', ativo: true, tipo: 'fixo', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'transicao_proposta', titulo: '8. Capa de Apresentação da Proposta Comercial', descricao: 'Abertura personalizada com o nome do cliente', ativo: true, tipo: 'dinamico_proposta', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'projeto_diagnostico', titulo: '9. Projeto & Posicionamento Estratégico', descricao: 'Cenário atual do cliente, diagnóstico e objetivos', ativo: true, tipo: 'dinamico_proposta', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'destaques_parallax', titulo: '10. Destaques & Indicadores Chave', descricao: 'Fases de execução, métricas e etapas do projeto', ativo: true, tipo: 'fixo', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'analise_redes', titulo: '11. Análise & Diagnóstico Digital', descricao: 'Diagnóstico dos canais atuais e oportunidades de melhoria', ativo: true, tipo: 'dinamico_proposta', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'gestao_redes', titulo: '12. Gestão de Redes (Escopo & Entregáveis)', descricao: 'Frequência de posts, captação e diretrizes do escopo', ativo: true, tipo: 'dinamico_proposta', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'meta_ads', titulo: '13. Campanhas de Mídia & Tráfego Pago', descricao: 'Estratégia de anúncios, métricas de retorno e orçamento sugerido', ativo: true, tipo: 'dinamico_proposta', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'google_ads', titulo: '14. Anúncios Google Ads', descricao: 'Busca intencional, rede display e palavras-chave', ativo: true, tipo: 'dinamico_proposta', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'site_institucional', titulo: '15. Desenvolvimento Web & Landing Pages', descricao: 'Criação de páginas e infraestrutura de alta conversão', ativo: true, tipo: 'dinamico_proposta', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'investimento_planos', titulo: '16. Investimento Comercial & Planos', descricao: 'Tabela de valores, parcelamento e condições financeiras', ativo: true, tipo: 'dinamico_proposta', podeEditar: true, mostrarNoMenuFlutuante: true },
    { id: 'dados_pagamento', titulo: '17. Dados Bancários & PIX', descricao: 'Chaves e dados para faturamento do contrato', ativo: true, tipo: 'fixo', podeEditar: false, mostrarNoMenuFlutuante: true },
    { id: 'garantias_termos', titulo: '18. Garantias & Cláusulas Contratuais', descricao: 'SLA, termos e proteção jurídica', ativo: true, tipo: 'fixo', podeEditar: false, mostrarNoMenuFlutuante: true },
    { id: 'aceite_fechamento', titulo: '19. Aceite Digital & Encerramento', descricao: 'Assinatura digital, WhatsApp e contatos finais do consultor', ativo: true, tipo: 'dinamico_proposta', podeEditar: true, mostrarNoMenuFlutuante: true },
  ],

  redesSociais: {
    instagram: '',
    website: '',
  },
  atualizadoEm: agora.toISOString(),
};

// Proposta inicial limpa de exemplo que pode ser personalizada ou excluída pelo usuário
export const PROPOSTAS_INICIAIS: Proposta[] = [
  {
    id: 'prop_modelo_exemplo',
    token: 'exemplo-proposta-comercial-demo',
    titulo: 'Estratégia de Crescimento e Performance Digital',
    clienteNome: 'Cliente Exemplo',
    clienteEmpresa: 'Empresa Parceira Ltda',
    clienteEmail: 'contato@cliente.com.br',
    clienteTelefone: '+55 11 99999-9999',
    clienteDocumento: '00.000.000/0001-00',
    clienteSegmento: 'Comércio & Serviços',
    clienteInstagram: '@cliente',

    projetoTexto: `Construir uma presença digital consistente e orientada a resultados para a Empresa Parceira Ltda, fortalecendo sua autoridade no mercado e gerando um fluxo previsível de oportunidades qualificadas.

A estratégia integrará comunicação assertiva, posicionamento profissional e campanhas de conversão focadas no público ideal da marca.`,

    analiseRedes: {
      perfilMockupUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      descricaoDiagnostico: 'Otimização dos pontos de contato digitais para aumentar a taxa de conversão e reforçar a credibilidade.',
      oportunidadesMelhoria: [
        'Padronização da identidade visual;',
        'Comunicação orientada a benefícios;',
        'Aceleração de respostas a leads;',
        'Estratégia contínua de atração de novos clientes.',
      ],
    },

    modulos: {
      gestaoRedes: {
        ativo: true,
        titulo: 'Gestão de Redes Sociais',
        postsPorSemana: '03 posts estratégicos por semana',
        videosProfissionaisMes: 8,
        artesMes: 4,
        fotosMes: 4,
        videomakerVisita: 'Captação presencial de conteúdo conforme cronograma alinhado.',
        postagensEstrategicas: 'Programação prévia e otimização para engajamento e conversão.',
        naoIncluso: 'Atendimento direto de SAC no chat.',
        redesAtendidas: ['Instagram', 'LinkedIn'],
        valorMensal: 1500.0,
        verbaImpulsionamentoMensal: 500.0,
      },
      metaAds: {
        ativo: true,
        titulo: 'Mídia de Performance (Meta Ads)',
        plataforma: 'Meta Ads',
        chamadaDestaque: 'ATRAÇÃO DE LEADS E VENDAS',
        descricao: 'Campanhas estratégicas para captar clientes qualificados.',
        verbaSugeridaDiaria: 40.0,
        entregaveis: ['Configuração de pixel e eventos', 'Testes A/B de criativos', 'Otimização semanal de ROAS'],
      },
    },

    precoDe: 3500.0,
    precoPor: 2700.0,
    condicaoPrimeiraMensalidade: 'Condição especial de implantação para início no mês vigente.',
    bonusInclusos: [
      'Configuração profissional de pixels e tags de conversão',
      'Relatório gerencial consolidado ao final de cada ciclo',
      'Suporte direto via canal prioritário no WhatsApp',
    ],

    apresentacao: 'Plano integrado com atração qualificada, engajamento estratégico e conversão de clientes.',
    objetivos: ['Aumento de vendas e fortalecimento de marca'],
    entregaveis: [],
    valorTotal: 2700.0,
    descontoAplicado: 800.0,
    condicoesPagamento: 'Mensalidade recorrente de R$ 2.700,00.',
    parcelamentoMax: 1,
    dataEmissao: subtrairDias(2),
    dataValidade: adicionarDias(15),
    status: 'ativo',
    visualizacoes: 1,
    ultimoAcesso: agora.toISOString(),
    ipUltimoAcesso: '127.0.0.1',
    criadoPor: 'Consultor Comercial',
    criadoPorId: 'usr_admin',
    criadoPorWhatsapp: '+55 11 99999-9999',
    criadoEm: subtrairDias(2),
    atualizadoEm: agora.toISOString(),
  }
];

export const LOGS_AUDITORIA_INICIAIS: LogAuditoria[] = [];

export const NOTIFICACOES_EMAIL_INICIAIS: NotificacaoEmail[] = [];
