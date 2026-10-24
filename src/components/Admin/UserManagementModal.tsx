import { maskPhone } from '../../utils/masks';
import React, { useState } from 'react';
import { 
  Users, UserPlus, Shield, Phone, Mail, Lock, CheckCircle, 
  X, AlertTriangle, KeyRound, Sparkles, UserCheck, UserX, Edit2,
  Upload, Share2, Copy, Check, Download, Briefcase, User as UserIcon,
  ExternalLink, QrCode, Smartphone
} from 'lucide-react';
import { Usuario, PapelUsuario } from '../../types';
import { validarUploadImagem } from '../../utils/security';

interface UserManagementModalProps {
  usuarios: Usuario[];
  usuarioAtual: Usuario;
  onSalvarUsuario: (usuario: Usuario) => void;
  onAlternarStatusUsuario: (id: string, novoStatus: 'ativo' | 'bloqueado') => void;
  onFechar: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  usuarios,
  usuarioAtual,
  onSalvarUsuario,
  onAlternarStatusUsuario,
  onFechar,
}) => {
  const [aba, setAba] = useState<'lista' | 'novo' | 'minha_conta' | 'cartao'>('lista');
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<Usuario | null>(null);
  const [usuarioSelecionadoCartao, setUsuarioSelecionadoCartao] = useState<Usuario>(usuarioAtual);

  // Formulário de Criação/Edição pelo Admin
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cargo, setCargo] = useState('Consultor Comercial');
  const [fotoUrl, setFotoUrl] = useState('');
  const [papel, setPapel] = useState<PapelUsuario>('comercial');
  const [podeCriarSecoes, setPodeCriarSecoes] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Formulário de alteração de senha pelo próprio usuário
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [feedbackSenha, setFeedbackSenha] = useState<string | null>(null);

  // Estado de cópia de link
  const [linkCopiado, setLinkCopiado] = useState(false);

  const isAdmin = usuarioAtual.papel === 'admin';

  const abrirEdicaoUsuario = (u: Usuario) => {
    setUsuarioEmEdicao(u);
    setNome(u.nome);
    setEmail(u.email);
    setWhatsapp(u.whatsapp);
    setCargo(u.cargo || (u.papel === 'admin' ? 'Diretor Executivo' : 'Consultor Comercial'));
    setFotoUrl(u.fotoUrl || '');
    setPapel(u.papel);
    setSenha('');
    setPodeCriarSecoes(u.podeCriarSecoes ?? false);
    setErroForm(null);
    setAba('novo');
  };

  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validacao = validarUploadImagem(file);
    if (!validacao.valido) {
      setErroForm(validacao.mensagemErro || 'Imagem inválida. Use JPG, PNG ou WebP de até 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSalvarUsuarioAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErroForm('Apenas administradores podem gerenciar usuários.');
      return;
    }

    if (!nome.trim() || !email.trim() || !whatsapp.trim()) {
      setErroForm('Por favor, preencha todos os campos obrigatórios (Nome, E-mail e WhatsApp).');
      return;
    }

    if (!usuarioEmEdicao && !senha.trim()) {
      setErroForm('A senha é obrigatória para novos usuários.');
      return;
    }

    const slugGerado = nome
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const usuarioSalvo: Usuario = {
      id: usuarioEmEdicao ? usuarioEmEdicao.id : `usr_${Date.now()}`,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: whatsapp.trim(),
      cargo: cargo.trim() || (papel === 'admin' ? 'Diretor Executivo' : 'Consultor Comercial'),
      fotoUrl: fotoUrl.trim(),
      slug: usuarioEmEdicao?.slug || slugGerado,
      senha: senha.trim() ? senha.trim() : (usuarioEmEdicao?.senha || 'senhaPadrao123'),
      papel,
      status: usuarioEmEdicao ? usuarioEmEdicao.status : 'ativo',
      podeCriarSecoes: papel === 'admin' ? true : podeCriarSecoes,
      ultimoLogin: usuarioEmEdicao?.ultimoLogin,
    };

    onSalvarUsuario(usuarioSalvo);
    setUsuarioEmEdicao(null);
    setNome('');
    setEmail('');
    setWhatsapp('');
    setCargo('');
    setFotoUrl('');
    setPapel('comercial');
    setSenha('');
    setPodeCriarSecoes(false);
    setErroForm(null);
    setAba('lista');
  };

  const handleAlterarMinhaSenha = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSenha(null);

    if (novaSenha.length < 6) {
      setFeedbackSenha('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmaSenha) {
      setFeedbackSenha('A confirmação da nova senha não confere.');
      return;
    }

    const usuarioAtualizado: Usuario = {
      ...usuarioAtual,
      senha: novaSenha,
    };

    onSalvarUsuario(usuarioAtualizado);
    setNovaSenha('');
    setConfirmaSenha('');
    setSenhaAtual('');
    setFeedbackSenha('Senha alterada com sucesso!');
  };

  // GERADOR E DOWNLOAD DE VCARD (.VCF) PARA SALVAR NO CELULAR
  const handleBaixarVCard = (u: Usuario) => {
    const telefoneNumerico = u.whatsapp.replace(/\D/g, '');
    const vcardContent = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${u.nome}`,
      `ORG:Agência Comercial`,
      `TITLE:${u.cargo || (u.papel === 'admin' ? 'Diretor' : 'Comercial')}`,
      `TEL;TYPE=CELL,VOICE;VALUE=uri:tel:+${telefoneNumerico}`,
      `EMAIL;TYPE=WORK:${u.email}`,
      `NOTE:Contato Profissional do Consultor Comercial.`,
      'END:VCARD',
    ].join('\r\n');

    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `${u.nome.replace(/\s+/g, '_')}_contato.vcf`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopiarLinkCartao = (u: Usuario) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${window.location.origin}/u/${u.slug || u.id}`;
    navigator.clipboard.writeText(url);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8">
        
        {/* HEADER */}
        <div className="p-6 sm:p-8 bg-zinc-50 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                Gestão da Equipe Comercial & Acessos
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                {isAdmin 
                  ? 'Cadastre usuários (Admin ou Comercial), cargos, fotos e gere cartões digitais com vCard para celular.' 
                  : 'Gerencie seu perfil e suas credenciais de acesso.'}
              </p>
            </div>
          </div>

          <button
            onClick={onFechar}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex flex-wrap border-b border-zinc-200 dark:border-zinc-800 px-6 sm:px-8 bg-zinc-100/50 dark:bg-zinc-950/30 gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => { setAba('lista'); setUsuarioEmEdicao(null); }}
                className={`py-3.5 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  aba === 'lista'
                    ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Equipe Cadastrada ({usuarios.length})
              </button>

              <button
                onClick={() => {
                  setUsuarioEmEdicao(null);
                  setNome('');
                  setEmail('');
                  setWhatsapp('');
                  setCargo('Consultor Comercial');
                  setFotoUrl('');
                  setPapel('comercial');
                  setSenha('');
                  setPodeCriarSecoes(false);
                  setErroForm(null);
                  setAba('novo');
                }}
                className={`py-3.5 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  aba === 'novo'
                    ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                {usuarioEmEdicao ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
              </button>
            </>
          )}

          <button
            onClick={() => {
              setUsuarioSelecionadoCartao(usuarioAtual);
              setAba('cartao');
            }}
            className={`py-3.5 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              aba === 'cartao'
                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Cartão Digital & vCard
          </button>

          <button
            onClick={() => setAba('minha_conta')}
            className={`py-3.5 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              aba === 'minha_conta'
                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Minha Senha & Perfil
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
          
          {/* ABA: LISTA DE USUÁRIOS (ADMIN) */}
          {aba === 'lista' && isAdmin && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <span>Usuário / Perfil</span>
                <span>Contato & Cargo</span>
                <span>Ações Rápidas</span>
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {usuarios.map(u => (
                  <div key={u.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {u.fotoUrl ? (
                        <img
                          src={u.fotoUrl}
                          alt={u.nome}
                          className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-zinc-200 dark:border-zinc-700 shrink-0"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 ${
                          u.papel === 'admin' ? 'bg-purple-700' : 'bg-amber-600'
                        }`}>
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-white text-base">
                            {u.nome}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            u.papel === 'admin' 
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' 
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}>
                            {u.papel === 'admin' ? 'Administrador' : 'Comercial'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.status === 'ativo'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          }`}>
                            {u.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {u.cargo || (u.papel === 'admin' ? 'Diretor Geral' : 'Consultor Comercial')} • {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end text-xs text-zinc-600 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{u.whatsapp || 'Sem WhatsApp informado'}</span>
                      </div>
                      <span className="text-[11px] text-zinc-400 mt-0.5">
                        {u.papel === 'admin' ? 'Acesso Diretor / SIEM' : (u.podeCriarSecoes ? '✓ Pode criar seções' : '• Seções controladas pelo admin')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Botão Ver Cartão Digital */}
                      <button
                        onClick={() => {
                          setUsuarioSelecionadoCartao(u);
                          setAba('cartao');
                        }}
                        className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Ver Cartão Digital e Link de Compartilhamento"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Cartão</span>
                      </button>

                      <button
                        onClick={() => abrirEdicaoUsuario(u)}
                        className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Editar cadastro completo"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Editar</span>
                      </button>

                      {u.id !== usuarioAtual.id && (
                        <button
                          onClick={() => onAlternarStatusUsuario(u.id, u.status === 'ativo' ? 'bloqueado' : 'ativo')}
                          className={`p-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                            u.status === 'ativo'
                              ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={u.status === 'ativo' ? 'Bloquear usuário' : 'Ativar usuário'}
                        >
                          {u.status === 'ativo' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          <span>{u.status === 'ativo' ? 'Bloquear' : 'Ativar'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: FORMULÁRIO DE CADASTRO / EDIÇÃO */}
          {aba === 'novo' && isAdmin && (
            <form onSubmit={handleSalvarUsuarioAdmin} className="space-y-6 max-w-2xl mx-auto">
              {erroForm && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{erroForm}</span>
                </div>
              )}

              {/* SELEÇÃO DO TIPO DE USUÁRIO: ADMIN OU COMERCIAL */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  Tipo de Usuário / Nível de Acesso *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPapel('admin')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      papel === 'admin'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 ring-2 ring-purple-500'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-purple-600" />
                        Administrador (Diretor)
                      </span>
                      {papel === 'admin' && <Check className="w-4 h-4 text-purple-600" />}
                    </div>
                    <ul className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
                      <li>• Acesso a todas as métricas globais e pipeline</li>
                      <li>• Gestão do CMS e identidade visual</li>
                      <li>• Cadastro de usuários e concessão de acessos</li>
                    </ul>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPapel('comercial')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      papel === 'comercial'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 ring-2 ring-purple-500'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-amber-600" />
                        Comercial (Consultor)
                      </span>
                      {papel === 'comercial' && <Check className="w-4 h-4 text-purple-600" />}
                    </div>
                    <ul className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
                      <li>• Criação e envio das próprias propostas</li>
                      <li>• Métricas restritas ao seu faturamento pessoal</li>
                      <li>• WhatsApp exclusivo no botão de contato</li>
                    </ul>
                  </button>
                </div>
              </div>

              {/* FOTO E CARGO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Ex: Consultor Comercial"
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Cargo / Função na Agência *
                  </label>
                  <input
                    type="text"
                    required
                    value={cargo}
                    onChange={e => setCargo(e.target.value)}
                    placeholder="Ex: Especialista em Performance & Vendas"
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
              </div>

              {/* FOTO DE PERFIL */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  Foto de Perfil do Usuário (Para o Cartão Digital e Proposta)
                </label>
                <div className="flex items-center gap-4">
                  {fotoUrl ? (
                    <img 
                      src={fotoUrl} 
                      alt="Prévia" 
                      className="w-16 h-16 rounded-2xl object-cover shadow-md border border-zinc-300 dark:border-zinc-700" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <UserIcon className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={fotoUrl}
                      onChange={e => setFotoUrl(e.target.value)}
                      placeholder="Cole a URL da foto ou selecione o arquivo abaixo"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
                    />
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-purple-700 dark:text-purple-300 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      Fazer Upload de Foto do Computador
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadFoto}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Contato WhatsApp Oficial *
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={e => setWhatsapp(maskPhone(e.target.value))}
                    maxLength={17}
                    placeholder="+55 11 99999-9999"
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Ex: consultor@suaagencia.com.br"
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  {usuarioEmEdicao ? 'Definir Nova Senha (Opcional)' : 'Senha de Acesso Inicial *'}
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder={usuarioEmEdicao ? 'Deixe em branco para manter a senha atual' : 'Mínimo de 6 caracteres'}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>

              {papel === 'comercial' && (
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-zinc-900 dark:text-white block">
                      Permitir que este consultor crie seções customizadas
                    </span>
                    <span className="text-xs text-zinc-500">
                      Habilita o construtor visual de seções nas propostas emitidas por ele.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={podeCriarSecoes}
                    onChange={e => setPodeCriarSecoes(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setAba('lista'); setUsuarioEmEdicao(null); }}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-lg cursor-pointer"
                >
                  {usuarioEmEdicao ? 'Salvar Alterações' : 'Concluir Cadastro do Usuário'}
                </button>
              </div>
            </form>
          )}

          {/* ABA: CARTÃO DIGITAL & LINK VCARD */}
          {aba === 'cartao' && usuarioSelecionadoCartao && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                  Cartão de Contato Digital
                </h3>
                <p className="text-xs text-zinc-500">
                  Compartilhe o link do consultor ou faça download do arquivo vCard para salvar direto no celular.
                </p>
              </div>

              {/* VISUALIZAÇÃO DO CARD DO USUÁRIO */}
              <div className="bg-gradient-to-br from-purple-950 via-zinc-900 to-black text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-purple-800/40 relative overflow-hidden text-center space-y-4">

                <div className="relative mx-auto w-24 h-24 rounded-full overflow-hidden border-4 border-amber-500 shadow-xl">
                  {usuarioSelecionadoCartao.fotoUrl ? (
                    <img 
                      src={usuarioSelecionadoCartao.fotoUrl} 
                      alt={usuarioSelecionadoCartao.nome}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-purple-800 flex items-center justify-center text-3xl font-bold">
                      {usuarioSelecionadoCartao.nome.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {usuarioSelecionadoCartao.nome}
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold text-amber-400 mt-0.5">
                    {usuarioSelecionadoCartao.cargo || (usuarioSelecionadoCartao.papel === 'admin' ? 'Diretor Executivo' : 'Consultor Comercial')}
                  </p>
                  <p className="text-[11px] text-purple-300 font-mono mt-1">
                    CONTATO PROFISSIONAL
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs text-left max-w-sm mx-auto">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-zinc-200">{usuarioSelecionadoCartao.whatsapp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-zinc-300 truncate">{usuarioSelecionadoCartao.email}</span>
                  </div>
                </div>

                {/* BOTÕES DO CARTÃO: SALVAR NO CELULAR & WHATSAPP */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center max-w-sm mx-auto">
                  <button
                    onClick={() => handleBaixarVCard(usuarioSelecionadoCartao)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Salvar no Celular (.vcf)
                  </button>

                  <a
                    href={`https://wa.me/${usuarioSelecionadoCartao.whatsapp.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(usuarioSelecionadoCartao.nome)},%20estou%20entrando%20em%20contato%20através%20do%20seu%20cartão%20digital.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    Chamar no WhatsApp
                  </a>
                </div>
              </div>

              {/* LINK DE COMPARTILHAMENTO */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 block">
                  Link de Compartilhamento do Usuário:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/u/${usuarioSelecionadoCartao.slug || usuarioSelecionadoCartao.id}`}
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-700 dark:text-zinc-300 select-all"
                  />
                  <button
                    onClick={() => handleCopiarLinkCartao(usuarioSelecionadoCartao)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    {linkCopiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{linkCopiado ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ABA: MINHA SENHA & PERFIL */}
          {aba === 'minha_conta' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-3">
                  {usuarioAtual.fotoUrl ? (
                    <img src={usuarioAtual.fotoUrl} alt={usuarioAtual.nome} className="w-12 h-12 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-purple-800 text-white font-bold flex items-center justify-center">
                      {usuarioAtual.nome.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{usuarioAtual.nome}</h4>
                    <p className="text-xs text-zinc-500">{usuarioAtual.cargo || 'Membro da Equipe Comercial'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-400 block">Nível de Acesso:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 uppercase">{usuarioAtual.papel}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">WhatsApp Cadastrado:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{usuarioAtual.whatsapp}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleAlterarMinhaSenha} className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purple-600" />
                  Alterar Minha Senha de Acesso
                </h4>

                {feedbackSenha && (
                  <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
                    feedbackSenha.includes('sucesso')
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  }`}>
                    {feedbackSenha.includes('sucesso') ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{feedbackSenha}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Nova Senha *
                  </label>
                  <input
                    type="password"
                    required
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmaSenha}
                    onChange={e => setConfirmaSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  Atualizar Minha Senha
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
