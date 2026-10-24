import React, { useState } from 'react';
import { 
  Plus, Search, Copy, Check, Eye, Trash2, Edit3, Power, 
  ExternalLink, Clock, TrendingUp, AlertTriangle, CheckCircle, 
  Share2, Shield, Calendar, DollarSign, X, Mail, BarChart3, 
  PieChart as PieIcon, ArrowUpRight, Zap, Users, ShieldAlert,
  Send, UserCheck, Activity, Phone
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { Proposta, StatusProposta, ConfiguracaoFixa, Usuario } from '../../types';
import { 
  formatarMoeda, 
  formatarData, 
  formatarDataHora 
} from '../../utils/security';
import { EmailSimulatorModal } from './EmailSimulatorModal';

interface AdminDashboardProps {
  propostas: Proposta[];
  config: ConfiguracaoFixa;
  usuarioAtual: Usuario;
  usuarios: Usuario[];
  onNavegarCriar: () => void;
  onNavegarEditar: (proposta: Proposta) => void;
  onAlternarStatus: (id: string, novoStatus: StatusProposta) => void;
  onExcluirProposta: (id: string) => void;
  onVisualizarComoCliente: (proposta: Proposta) => void;
  onRegistrarEnvioEmail: (proposta: Proposta, email: string, assunto: string) => void;
  onAbrirGerenciadorUsuarios: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  propostas,
  config,
  usuarioAtual,
  usuarios,
  onNavegarCriar,
  onNavegarEditar,
  onAlternarStatus,
  onExcluirProposta,
  onVisualizarComoCliente,
  onRegistrarEnvioEmail,
  onAbrirGerenciadorUsuarios,
}) => {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Modal do Simulador de Envio de E-mail
  const [propostaEmailAlvo, setPropostaEmailAlvo] = useState<Proposta | null>(null);

  const isAdmin = usuarioAtual.papel === 'admin';

  // Regra de Isolamento ACL: se for comercial, enxerga apenas suas próprias propostas
  const propostasAutorizadas = isAdmin
    ? propostas
    : propostas.filter(p => p.criadoPorId === usuarioAtual.id || p.criadoPor === usuarioAtual.nome);

  // Métricas do Dashboard calculadas no escopo autorizado
  const totalPropostas = propostasAutorizadas.length;
  const propostasAtivas = propostasAutorizadas.filter(p => p.status === 'ativo').length;
  const propostasAceitas = propostasAutorizadas.filter(p => p.status === 'aceito').length;
  const propostasExpiradas = propostasAutorizadas.filter(p => {
    return p.status === 'expirado' || new Date(p.dataValidade).getTime() < Date.now();
  }).length;
  const propostasInativas = propostasAutorizadas.filter(p => p.status === 'inativo').length;

  // Taxa de Conversão Real
  const taxaConversao = totalPropostas > 0 ? ((propostasAceitas / totalPropostas) * 100).toFixed(1) : '0';

  // Valores Financeiros
  const valorTotalPipeline = propostasAutorizadas.reduce((acc, p) => acc + (p.precoPor || p.valorTotal), 0);
  const valorFechado = propostasAutorizadas
    .filter(p => p.status === 'aceito')
    .reduce((acc, p) => acc + (p.precoPor || p.valorTotal), 0);
  const ticketMedio = totalPropostas > 0 ? valorTotalPipeline / totalPropostas : 0;
  const totalVisualizacoes = propostasAutorizadas.reduce((acc, p) => acc + p.visualizacoes, 0);

  // Dados para os Gráficos Recharts
  const dadosConversaoPie = [
    { name: 'Propostas Aceitas', value: propostasAceitas, color: '#10B981' },
    { name: 'Em Negociação / Ativas', value: propostasAtivas, color: config.corPrimaria || '#5A0072' },
    { name: 'Expiradas', value: propostasExpiradas, color: '#F59E0B' },
    { name: 'Inativas / Pausadas', value: propostasInativas, color: '#6B7280' },
  ].filter(d => d.value > 0);

  const dadosStatusBarras = [
    { status: 'Ativas', quantidade: propostasAtivas, valor: propostasAutorizadas.filter(p => p.status === 'ativo').reduce((a, b) => a + (b.precoPor || b.valorTotal), 0) },
    { status: 'Aceitas', quantidade: propostasAceitas, valor: valorFechado },
    { status: 'Expiradas', quantidade: propostasExpiradas, valor: propostasAutorizadas.filter(p => p.status === 'expirado').reduce((a, b) => a + (b.precoPor || b.valorTotal), 0) },
  ];

  // Filtro de lista
  const propostasFiltradas = propostasAutorizadas.filter(p => {
    const matchBusca = 
      p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      p.clienteEmpresa.toLowerCase().includes(busca.toLowerCase()) ||
      p.clienteNome.toLowerCase().includes(busca.toLowerCase());
    
    if (filtroStatus === 'todos') return matchBusca;
    if (filtroStatus === 'expirados') {
      return matchBusca && (p.status === 'expirado' || new Date(p.dataValidade).getTime() < Date.now());
    }
    return matchBusca && p.status === filtroStatus;
  });

  const handleCopiarLink = (token: string, id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* CABEÇALHO DO PAINEL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {isAdmin ? 'Dashboard Geral de Gestão Comercial' : `Painel Comercial • ${usuarioAtual.nome}`}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
              isAdmin 
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' 
                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
            }`}>
              {isAdmin ? 'Acesso Diretor / Admin' : 'Consultor Comercial'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {isAdmin 
              ? 'Visão global das propostas de toda a agência, indicadores de conversão, disparador de e-mails e gestão da equipe.' 
              : `Gerenciamento das suas propostas comerciais ativas. Botão WhatsApp conectado ao seu número: ${usuarioAtual.whatsapp}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onAbrirGerenciadorUsuarios}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors"
          >
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>{isAdmin ? `Equipe Comercial (${usuarios.length})` : 'Meu Perfil & Senha'}</span>
          </button>

          <button
            onClick={onNavegarCriar}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-xl hover:opacity-95 transition-all"
            style={{ backgroundColor: config.corPrimaria }}
          >
            <Plus className="w-4 h-4" />
            Nova Proposta Comercial
          </button>
        </div>
      </div>

      {/* AVISO ACL PARA USUÁRIO COMERCIAL */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Modo Comercial Restrito:</strong> Você só visualiza suas próprias propostas e indicadores pessoais. Métricas globais da agência e propostas de outros consultores são protegidas pela política de privacidade e segurança corporativa.
            </span>
          </div>
          <span className="font-mono font-bold text-[11px] bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded">
            ID: {usuarioAtual.id}
          </span>
        </div>
      )}

      {/* PAINEL DE INDICADORES (GRÁFICOS RECHARTS & CARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO 1: TAXA DE CONVERSÃO (ACEITAS VS ENVIADAS) */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-purple-600" />
                {isAdmin ? 'Taxa de Conversão da Agência' : 'Sua Taxa de Conversão'}
              </span>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                {taxaConversao}% de Fechamento
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Propostas Aceitas ({propostasAceitas}) vs Total Emitidas ({totalPropostas})
            </p>
          </div>

          <div className="h-56 w-full">
            {dadosConversaoPie.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                Sem dados de propostas para este perfil.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosConversaoPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {dadosConversaoPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any) => [`${value} propostas`, name]} 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Aceitas Formalmente</div>
              <div className="text-lg font-black text-emerald-600">{propostasAceitas}</div>
            </div>
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Suas Propostas</div>
              <div className="text-lg font-black text-zinc-900 dark:text-white">{totalPropostas}</div>
            </div>
          </div>
        </div>

        {/* GRÁFICO 2: VOLUME FINANCEIRO & DISTRIBUIÇÃO */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                {isAdmin ? 'Pipeline Geral por Volume' : 'Seu Pipeline de Vendas'}
              </span>
              <span className="text-xs font-bold text-zinc-400">R$ Reais</span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isAdmin ? 'Faturamento potencial da agência vs homologado' : 'Seu potencial de fechamento mensal'}
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosStatusBarras} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={val => `R$${val / 1000}k`} />
                <Tooltip 
                  formatter={(val: any) => [formatarMoeda(Number(val)), 'Valor Total']}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {dadosStatusBarras.map((_, i) => (
                    <Cell key={i} fill={i === 1 ? '#10B981' : i === 0 ? config.corPrimaria : '#F59E0B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <div className="text-[10px] text-zinc-400 font-bold uppercase">{isAdmin ? 'Pipeline Total' : 'Seu Pipeline'}</div>
              <div className="text-base font-black font-mono text-zinc-900 dark:text-white">{formatarMoeda(valorTotalPipeline)}</div>
            </div>
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <div className="text-[10px] text-emerald-600 font-bold uppercase">Faturamento Fechado</div>
              <div className="text-base font-black font-mono text-emerald-600">{formatarMoeda(valorFechado)}</div>
            </div>
          </div>
        </div>

        {/* CARDS RESUMO EXECUTIVO */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="bg-gradient-to-br from-purple-900 to-zinc-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                {isAdmin ? 'Ticket Médio da Agência' : 'Seu Ticket Médio'}
              </span>
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-black font-mono text-white mb-1">
              {formatarMoeda(ticketMedio)}
            </div>
            <div className="text-xs text-purple-200">
              {isAdmin ? 'Média calculada sobre todas as propostas ativas' : 'Média das propostas sob sua responsabilidade'}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-500" />
                Acessos Registrados pelos Clientes
              </div>
              <div className="text-2xl font-black text-zinc-900 dark:text-white">
                {totalVisualizacoes} Visualizações
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Validações de URL e tokens monitorados
              </p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-3xl border border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Alerta de Validade
              </div>
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {propostasExpiradas} {propostasExpiradas === 1 ? 'proposta expirou' : 'propostas expiraram'} o prazo limite
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* WIDGETS ADICIONAIS: AÇÕES RÁPIDAS & ATIVIDADE RECENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* WIDGET 1: AÇÕES RÁPIDAS */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
              Ações Rápidas do Comercial
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={onNavegarCriar}
              className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-zinc-200 dark:border-zinc-800 text-left transition-all group cursor-pointer"
            >
              <Plus className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform mb-2" />
              <div className="text-xs font-bold text-zinc-900 dark:text-white">Nova Proposta</div>
              <div className="text-[10px] text-zinc-400">Criar do zero ou template</div>
            </button>

            <button
              onClick={onAbrirGerenciadorUsuarios}
              className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-zinc-200 dark:border-zinc-800 text-left transition-all group cursor-pointer"
            >
              <Users className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform mb-2" />
              <div className="text-xs font-bold text-zinc-900 dark:text-white">{isAdmin ? 'Gerenciar Equipe' : 'Minhas Credenciais'}</div>
              <div className="text-[10px] text-zinc-400">{isAdmin ? 'Cadastrar consultores' : 'Alterar sua senha'}</div>
            </button>

            {propostasAutorizadas.length > 0 && (
              <button
                onClick={() => setPropostaEmailAlvo(propostasAutorizadas[0])}
                className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-zinc-200 dark:border-zinc-800 text-left transition-all group cursor-pointer"
              >
                <Mail className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform mb-2" />
                <div className="text-xs font-bold text-zinc-900 dark:text-white">Simular E-mail</div>
                <div className="text-[10px] text-zinc-400">Disparo de teste</div>
              </button>
            )}
          </div>
        </div>

        {/* WIDGET 2: ATIVIDADE RECENTE */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Propostas em Destaque & Status
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400">{propostasAutorizadas.length} registradas</span>
          </div>

          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {propostasAutorizadas.slice(0, 4).map(prop => (
              <div 
                key={prop.id}
                className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    prop.status === 'ativo' ? 'bg-emerald-500' :
                    prop.status === 'aceito' ? 'bg-purple-600' : 'bg-amber-500'
                  }`} />
                  <div className="truncate">
                    <span className="font-bold text-zinc-900 dark:text-white block truncate">{prop.clienteEmpresa}</span>
                    <span className="text-[10px] text-zinc-400">Criado por {prop.criadoPor}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{formatarMoeda(prop.precoPor || prop.valorTotal)}</span>
                  <button
                    onClick={() => onVisualizarComoCliente(prop)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    title="Ver Proposta"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por cliente, título ou empresa..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'todos', label: 'Todas' },
            { id: 'ativo', label: 'Ativas' },
            { id: 'inativo', label: 'Inativas' },
            { id: 'expirados', label: 'Expiradas' },
            { id: 'aceito', label: 'Aceitas' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltroStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filtroStatus === f.id
                  ? 'bg-purple-900 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA DE PROPOSTAS COM DISPARO DE E-MAIL E EDIÇÃO FULL-PAGE */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-xs uppercase font-bold text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-5 py-4">Proposta / Cliente</th>
                <th className="px-5 py-4">Consultor & WhatsApp</th>
                <th className="px-5 py-4">Token & Link</th>
                <th className="px-5 py-4">Validade</th>
                <th className="px-5 py-4">Status / Switch</th>
                <th className="px-5 py-4 text-right">Investimento (POR)</th>
                <th className="px-5 py-4 text-center">Views</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {propostasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-500">
                    Nenhuma proposta comercial encontrada nesta visualização.
                  </td>
                </tr>
              ) : (
                propostasFiltradas.map(prop => {
                  const agoraTimestamp = Date.now();
                  const validadeTimestamp = new Date(prop.dataValidade).getTime();
                  const isExpiradaReal = validadeTimestamp < agoraTimestamp;

                  return (
                    <tr key={prop.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-zinc-900 dark:text-white line-clamp-1 max-w-xs">
                          {prop.titulo}
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {prop.clienteEmpresa}
                          </span>
                          <span>•</span>
                          <span>{prop.clienteNome}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {prop.criadoPor || 'Consultor Comercial'}
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{prop.criadoPorWhatsapp || config.telefoneWhatsapp}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                            {prop.token.substring(0, 10)}...
                          </code>
                          <button
                            onClick={() => handleCopiarLink(prop.token, prop.id)}
                            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
                            title="Copiar URL Segura com Token"
                          >
                            {copiadoId === prop.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className={`w-3.5 h-3.5 ${isExpiradaReal ? 'text-red-500' : 'text-amber-500'}`} />
                          <span className={`text-xs font-semibold ${isExpiradaReal ? 'text-red-600 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {formatarData(prop.dataValidade)}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {isExpiradaReal ? <span className="text-red-500">Expirada</span> : 'No prazo'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const novo = prop.status === 'ativo' ? 'inativo' : 'ativo';
                              onAlternarStatus(prop.id, novo);
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              prop.status === 'ativo' ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}
                            title={prop.status === 'ativo' ? 'Clique para desativar' : 'Clique para ativar'}
                          >
                            <span 
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                prop.status === 'ativo' ? 'translate-x-4' : 'translate-x-0'
                              }`} 
                            />
                          </button>
                          
                          <span className={`text-xs font-bold uppercase tracking-wider ${
                            prop.status === 'ativo' ? 'text-emerald-600 dark:text-emerald-400' :
                            prop.status === 'aceito' ? 'text-purple-600 dark:text-purple-400' :
                            prop.status === 'expirado' || isExpiradaReal ? 'text-red-500' : 'text-zinc-400'
                          }`}>
                            {prop.status}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="font-bold font-mono text-zinc-900 dark:text-white">
                          {formatarMoeda(prop.precoPor || prop.valorTotal)}
                        </div>
                        {prop.precoDe > (prop.precoPor || prop.valorTotal) && (
                          <div className="text-[10px] text-zinc-400 line-through">
                            De: {formatarMoeda(prop.precoDe)}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          <Eye className="w-3 h-3 text-zinc-400" />
                          {prop.visualizacoes}
                        </span>
                      </td>

                      {/* AÇÕES */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Notificar por E-mail */}
                          <button
                            onClick={() => setPropostaEmailAlvo(prop)}
                            className="p-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors"
                            title="Disparar Notificação por E-mail com Template Oficial"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Ver como Cliente */}
                          <button
                            onClick={() => onVisualizarComoCliente(prop)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                            title="Visualizar Página do Cliente"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar em Página Dedicada */}
                          <button
                            onClick={() => onNavegarEditar(prop)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 transition-colors"
                            title="Editar Proposta em Página Dedicada"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Excluir (Se for admin ou criador da proposta) */}
                          {(isAdmin || prop.criadoPorId === usuarioAtual.id) && (
                            <button
                              onClick={() => {
                                if (confirm(`Confirma a exclusão da proposta "${prop.titulo}"?`)) {
                                  onExcluirProposta(prop.id);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors"
                              title="Excluir Proposta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DO SIMULADOR DE ENVIO DE E-MAIL */}
      {propostaEmailAlvo && (
        <EmailSimulatorModal
          proposta={propostaEmailAlvo}
          config={config}
          onFechar={() => setPropostaEmailAlvo(null)}
          onConfirmarEnvio={(email, assunto) => {
            onRegistrarEnvioEmail(propostaEmailAlvo, email, assunto);
          }}
        />
      )}

    </div>
  );
};
