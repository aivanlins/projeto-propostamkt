import React, { useState } from 'react';
import { 
  Building2, Palette, Upload, Check, Sparkles, Phone, Mail, 
  MapPin, Shield, RefreshCw, Eye, ExternalLink, Image as ImageIcon 
} from 'lucide-react';
import { ConfiguracaoFixa, PopupFeedback } from '../../types';
import { validarUploadImagem, sanitizarTexto } from '../../utils/security';
import { FeedbackPopup } from '../Common/FeedbackPopup';

interface AgencySettingsPageProps {
  config: ConfiguracaoFixa;
  onSalvarConfig: (novaConfig: ConfiguracaoFixa) => void;
  onVisualizarProposta?: () => void;
}

const PALETAS_SUGERIDAS = [
  { nome: 'Roxo Real & Ouro Premium', primaria: '#5A0072', secundaria: '#DDA743' },
  { nome: 'Cinemático & Dark (Roxo Profundo & Amber)', primaria: '#2D003B', secundaria: '#F59E0B' },
  { nome: 'Midnight Blue & Ciano', primaria: '#0F172A', secundaria: '#06B6D4' },
  { nome: 'Esmeralda Tech & Dourado', primaria: '#064E3B', secundaria: '#F59E0B' },
  { nome: 'Rubi Luxo & Champagne', primaria: '#881337', secundaria: '#FBBF24' },
  { nome: 'All Black & Cyber Lime', primaria: '#18181B', secundaria: '#84CC16' },
];

export const AgencySettingsPage: React.FC<AgencySettingsPageProps> = ({
  config,
  onSalvarConfig,
  onVisualizarProposta,
}) => {
  const [formData, setFormData] = useState<ConfiguracaoFixa>({ ...config });
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<PopupFeedback>({
    tipo: 'sucesso',
    titulo: '',
    mensagem: '',
    aberto: false,
  });

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validacao = validarUploadImagem(file);
    if (!validacao.valido) {
      setFeedback({
        tipo: 'erro',
        titulo: 'Arquivo Inválido',
        mensagem: validacao.mensagemErro || 'Selecione uma imagem válida (JPG, PNG ou WebP).',
        aberto: true,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setFormData(prev => ({
        ...prev,
        logoUrl: url,
        capa: {
          ...prev.capa,
          logoUrl: url,
        },
      }));
      setFeedback({
        tipo: 'sucesso',
        titulo: 'Logo Carregada',
        mensagem: 'O logotipo da agência foi atualizado.',
        aberto: true,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    const configSanitizada: ConfiguracaoFixa = {
      ...formData,
      nomeAgencia: sanitizarTexto(formData.nomeAgencia),
      slogan: sanitizarTexto(formData.slogan),
      cnpj: sanitizarTexto(formData.cnpj),
      emailContato: sanitizarTexto(formData.emailContato),
      telefoneWhatsapp: sanitizarTexto(formData.telefoneWhatsapp),
      endereco: sanitizarTexto(formData.endereco),
      atualizadoEm: new Date().toISOString(),
    };

    onSalvarConfig(configSanitizada);
    setSalvando(false);
    setFeedback({
      tipo: 'sucesso',
      titulo: 'Informações da Agência Salvas',
      mensagem: 'O nome da agência, dados de contato e cores da identidade visual foram atualizados no sistema.',
      aberto: true,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* CABEÇALHO */}
      <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span 
              className="p-3 rounded-2xl text-white shadow-md flex items-center justify-center"
              style={{ backgroundColor: formData.corPrimaria || '#5A0072' }}
            >
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                Identidade & Dados da Agência
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Altere aqui o nome oficial, slogan, CNPJ, contatos e a paleta de cores da identidade visual da agência.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onVisualizarProposta && (
            <button
              type="button"
              onClick={onVisualizarProposta}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
            >
              <Eye className="w-4 h-4 text-purple-600" />
              <span>Ver Proposta ao Vivo</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={salvando}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-white font-bold text-xs shadow-lg hover:opacity-95 transition-all cursor-pointer"
            style={{ backgroundColor: formData.corPrimaria || '#5A0072' }}
          >
            <Check className="w-4 h-4" />
            <span>Salvar Informações</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SEÇÃO 1: CORES DA IDENTIDADE VISUAL */}
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                Cores Oficiais da Identidade Visual
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Estas cores são aplicadas automaticamente nos botões, cabeçalhos, destaques e cards de todas as propostas.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
              Global do Sistema
            </span>
          </div>

          {/* PALETAS RÁPIDAS PREDEFINIDAS */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-2.5">
              Paletas Recomendadas de Alto Padrão:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PALETAS_SUGERIDAS.map((paleta, pIdx) => {
                const selecionada = formData.corPrimaria === paleta.primaria && formData.corSecundaria === paleta.secundaria;
                return (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      corPrimaria: paleta.primaria,
                      corSecundaria: paleta.secundaria,
                    })}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selecionada 
                        ? 'border-purple-600 ring-2 ring-purple-500/20 bg-purple-50/40 dark:bg-purple-950/20' 
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                        {paleta.nome}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {paleta.primaria} / {paleta.secundaria}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-5 h-5 rounded-lg border border-white/20 shadow-xs" style={{ backgroundColor: paleta.primaria }} />
                      <span className="w-5 h-5 rounded-lg border border-white/20 shadow-xs" style={{ backgroundColor: paleta.secundaria }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CAMPOS CUSTOMIZADOS DE COR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* COR PRIMÁRIA */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
              <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">
                Cor Primária (Destaques, Botões e Capa)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.corPrimaria || '#5A0072'}
                  onChange={e => setFormData({ ...formData, corPrimaria: e.target.value })}
                  className="w-12 h-12 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={formData.corPrimaria}
                  onChange={e => setFormData({ ...formData, corPrimaria: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs uppercase font-bold"
                  placeholder="#5A0072"
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Utilizada para a identidade principal, botões de ação comercial, títulos de destaque e destaques na barra superior.
              </p>
            </div>

            {/* COR SECUNDÁRIA */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
              <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">
                Cor Secundária / Accent (Dourado / Acentos)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.corSecundaria || '#DDA743'}
                  onChange={e => setFormData({ ...formData, corSecundaria: e.target.value })}
                  className="w-12 h-12 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={formData.corSecundaria}
                  onChange={e => setFormData({ ...formData, corSecundaria: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs uppercase font-bold"
                  placeholder="#DDA743"
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Utilizada para badges, selos de garantia, prêmios e elementos secundários de contraste.
              </p>
            </div>
          </div>

          {/* PRÉVIA VISUAL EM TEMPO REAL DAS CORES */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Pré-visualização ao vivo dos elementos com as cores selecionadas:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                style={{ backgroundColor: formData.corPrimaria }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Botão Comercial Oficial</span>
              </button>

              <span 
                className="px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs"
                style={{ backgroundColor: formData.corSecundaria, color: '#000000' }}
              >
                ★ Destaque Secundário
              </span>

              <div 
                className="px-4 py-2 rounded-xl border text-xs font-bold"
                style={{ borderColor: formData.corPrimaria, color: formData.corSecundaria }}
              >
                Cartão de Investimento de Alto Padrão
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: DADOS INSTITUCIONAIS DA AGÊNCIA */}
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Informações Institucionais & Cadastro
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Estes dados são impressos nas propostas, lâminas de apresentação e rodapé de segurança jurídica.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                Nome da Agência
              </label>
              <input
                type="text"
                required
                value={formData.nomeAgencia}
                onChange={e => setFormData({ ...formData, nomeAgencia: e.target.value })}
                placeholder="Ex: Minha Agência de Marketing"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                Slogan / Posicionamento
              </label>
              <input
                type="text"
                value={formData.slogan}
                onChange={e => setFormData({ ...formData, slogan: e.target.value })}
                placeholder="Ex: Performance & Posicionamento Estratégico"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                CNPJ da Agência
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-mono text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                WhatsApp Oficial Central
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.telefoneWhatsapp}
                  onChange={e => setFormData({ ...formData, telefoneWhatsapp: e.target.value })}
                  placeholder="+55 12 98101-9913"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-mono text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                E-mail Oficial de Contato
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-purple-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.emailContato}
                  onChange={e => setFormData({ ...formData, emailContato: e.target.value })}
                  placeholder="contato@suaagencia.com.br"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                Endereço Físico / Sede
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Taubaté / Pindamonhangaba - SP"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* LOGOTIPO OFICIAL DA AGÊNCIA */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-2">
              Logotipo Oficial da Agência
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-inner">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo da Agência" className="max-w-full max-h-full object-contain" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-300" />
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.logoUrl || ''}
                    onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="URL direta da logo (ex: https://...)"
                    className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
                  />
                  <label className="p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer shrink-0" title="Fazer Upload de Arquivo">
                    <Upload className="w-4 h-4 text-purple-600" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadLogo}
                    />
                  </label>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Formatos aceitos: PNG transparente, SVG ou JPG em alta resolução. Recomendado fundo transparente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTÃO SALVAR RODAPÉ */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-white font-bold text-sm shadow-xl hover:opacity-95 transition-all cursor-pointer"
            style={{ backgroundColor: formData.corPrimaria || '#5A0072' }}
          >
            <Check className="w-4 h-4" />
            <span>Salvar Todas as Configurações da Agência</span>
          </button>
        </div>
      </form>

      {/* FEEDBACK POPUP */}
      <FeedbackPopup
        feedback={feedback}
        onFechar={() => setFeedback(prev => ({ ...prev, aberto: false }))}
      />
    </div>
  );
};
