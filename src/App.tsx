/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  PROPOSTAS_INICIAIS, 
  CONFIGURACAO_FIXA_INICIAL, 
  LOGS_AUDITORIA_INICIAIS,
  ESTADO_INSTALACAO_INICIAL,
  NOTIFICACOES_EMAIL_INICIAIS,
  USUARIOS_INICIAIS
} from './mockData';
import { 
  Proposta, 
  ConfiguracaoFixa, 
  LogAuditoria, 
  StatusProposta,
  EstadoInstalacao,
  NotificacaoEmail,
  Usuario 
} from './types';
import { Phone, Mail, X, Download, Sun, Moon, Loader2, FileX } from 'lucide-react';
import { Navbar, ModoVisualizacao } from './components/Navbar';
import { ClientProposalView } from './components/ClientView/ClientProposalView';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { ProposalFormPage } from './components/Admin/ProposalFormPage';
import { CmsConfigEditor } from './components/Admin/CmsConfigEditor';
import { SystemInstallerPage } from './components/Installer/SystemInstallerPage';
import { SecurityLogs } from './components/Admin/SecurityLogs';
import { CpanelDeploymentKit } from './components/DeploymentKit/CpanelDeploymentKit';
import { UserManagementModal } from './components/Admin/UserManagementModal';
import { AgencySettingsPage } from './components/Admin/AgencySettingsPage';
import { LoginPage } from './components/Auth/LoginPage';
import { RedefinirSenhaPage } from './components/Auth/RedefinirSenhaPage';
import { baixarVCard } from './utils/security';
import { detectarRotaPublica, gerarSlugUnico } from './utils/propostaUrl';

export default function App() {
  const [cartaoPerfilAberto, setCartaoPerfilAberto] = useState<Usuario | null>(null);
  const [userModalAberto, setUserModalAberto] = useState(false);

  // Usuários do sistema
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    const salvo = localStorage.getItem('gc_usuarios');
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return USUARIOS_INICIAIS;
  });

  // Usuário atualmente autenticado
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario>(() => {
    const salvoId = localStorage.getItem('gc_usuario_atual_id');
    const salvoUser = localStorage.getItem('gc_usuario_logado');
    if (salvoUser) {
      try {
        return JSON.parse(salvoUser);
      } catch (e) {}
    }
    if (salvoId) {
      const enc = usuarios.find(u => u.id === salvoId);
      if (enc) return enc;
    }
    return usuarios[0] || USUARIOS_INICIAIS[0];
  });

  // Propostas e configurações
  const [propostas, setPropostas] = useState<Proposta[]>(() => {
    const salvo = localStorage.getItem('gc_propostas');
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return PROPOSTAS_INICIAIS;
  });

  const [config, setConfig] = useState<ConfiguracaoFixa>(() => {
    const salvo = localStorage.getItem('gc_config');
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo);
        return {
          ...CONFIGURACAO_FIXA_INICIAL,
          ...parsed,
          capa: { ...CONFIGURACAO_FIXA_INICIAL.capa, ...(parsed.capa || {}) },
          fundadores: { ...CONFIGURACAO_FIXA_INICIAL.fundadores, ...(parsed.fundadores || {}) },
          premiacao: { ...CONFIGURACAO_FIXA_INICIAL.premiacao, ...(parsed.premiacao || {}) },
          time: { ...CONFIGURACAO_FIXA_INICIAL.time, ...(parsed.time || {}) },
          servicosInstitucionais: parsed.servicosInstitucionais || CONFIGURACAO_FIXA_INICIAL.servicosInstitucionais,
          clientesApresentados: parsed.clientesApresentados || CONFIGURACAO_FIXA_INICIAL.clientesApresentados,
          secoesOrdem: (parsed.secoesOrdem && Array.isArray(parsed.secoesOrdem) && parsed.secoesOrdem.length > 0) 
            ? parsed.secoesOrdem 
            : CONFIGURACAO_FIXA_INICIAL.secoesOrdem,
        };
      } catch (e) {}
    }
    return CONFIGURACAO_FIXA_INICIAL;
  });

  const [logs, setLogs] = useState<LogAuditoria[]>(() => {
    const salvo = localStorage.getItem('gc_logs');
    if (salvo) {
      try { return JSON.parse(salvo); } catch (e) {}
    }
    return LOGS_AUDITORIA_INICIAIS;
  });

  const [estadoInstalacao, setEstadoInstalacao] = useState<EstadoInstalacao>(ESTADO_INSTALACAO_INICIAL);
  const [notificacoesEmail, setNotificacoesEmail] = useState<NotificacaoEmail[]>(NOTIFICACOES_EMAIL_INICIAIS);

  // Navegação
  const [modoAtual, setModoAtual] = useState<ModoVisualizacao>('cliente');
  const [propostaSelecionada, setPropostaSelecionada] = useState<Proposta>(propostas[0]);
  const [propostaEmEdicao, setPropostaEmEdicao] = useState<Proposta | null>(null);
  // Página pública da proposta (/proposta-<slug> ou ?token=...): sem login, sem menus do sistema
  const [rotaPublica] = useState(detectarRotaPublica);
  // Cartão digital público (/u/<slug>)
  const [slugCartaoPublico] = useState(() => {
    const m = window.location.pathname.match(/\/(?:u|cartao)\/([a-z0-9_-]+)\/?$/i);
    return m ? m[1].toLowerCase() : null;
  });
  const [cartaoPublico, setCartaoPublico] = useState<Usuario | null>(null);
  const [cartaoPublicoStatus, setCartaoPublicoStatus] = useState<'carregando' | 'ok' | 'nao_encontrado'>('carregando');
  useEffect(() => {
    if (!slugCartaoPublico) return;
    fetch(`/api/usuario/cartao/${encodeURIComponent(slugCartaoPublico)}`)
      .then(r => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
      .catch(() => null)
      .then(u => {
        if (u && u.id) { setCartaoPublico(u as Usuario); setCartaoPublicoStatus('ok'); document.title = u.nome; }
        else setCartaoPublicoStatus('nao_encontrado');
      });
  }, [slugCartaoPublico]);
  const [statusPublico, setStatusPublico] = useState<'carregando' | 'ok' | 'nao_encontrada'>(rotaPublica ? 'carregando' : 'ok');
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('gc_dark_mode') === 'true');

  // Gerenciamento de Autenticação e Instalação
  const [isLogado, setIsLogado] = useState(() => localStorage.getItem('is_logado') === 'true');
  const [instalado, setInstalado] = useState(() => localStorage.getItem('sistema_instalado') === 'true');

  // Checagem de status e hidratação de dados reais do MySQL
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (typeof data.instalado === 'boolean') {
          setInstalado(data.instalado);
          localStorage.setItem('sistema_instalado', String(data.instalado));
        }
      })
      .catch(() => {});
  }, []);

  // Hidratar dados completos do MySQL sempre que o usuário estiver autenticado ou o sistema estiver pronto
  useEffect(() => {
    if (rotaPublica) return; // Página pública do cliente não carrega dados administrativos
    if (isLogado || instalado) {
      // 1. Configuração da Agência
      fetch('/api/config')
        .then(res => res.json())
        .then(data => {
          if (data && data.nomeAgencia) {
            setConfig(prev => ({
              ...prev,
              ...data,
              capa: { ...prev.capa, ...(data.capa || {}) },
              fundadores: { ...prev.fundadores, ...(data.fundadores || {}) },
              premiacao: { ...prev.premiacao, ...(data.premiacao || {}) },
              time: { ...prev.time, ...(data.time || {}) },
              servicosInstitucionais: data.servicosInstitucionais || prev.servicosInstitucionais,
              clientesApresentados: data.clientesApresentados || prev.clientesApresentados,
              secoesOrdem: (data.secoesOrdem && Array.isArray(data.secoesOrdem) && data.secoesOrdem.length > 0)
                ? data.secoesOrdem
                : prev.secoesOrdem,
            }));
          }
        })
        .catch(() => {});

      // 2. Propostas Comerciais
      fetch('/api/propostas')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setPropostas(data);
            if (!propostaSelecionada || !data.some(p => p.id === propostaSelecionada.id)) {
              setPropostaSelecionada(data[0]);
            }
          }
        })
        .catch(() => {});

      // 3. Usuários da Equipe
      fetch('/api/usuarios')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setUsuarios(data);
          }
        })
        .catch(() => {});

      // 4. Logs de Auditoria SIEM
      fetch('/api/logs')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLogs(data);
          }
        })
        .catch(() => {});
    }
  }, [isLogado, instalado]);

  // Sincronização tema escuro
  useEffect(() => {
    localStorage.setItem('gc_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Link de cartão de perfil (?perfil=slug)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const perfilParam = params.get('perfil');
    if (perfilParam) {
      const usuarioEncontrado = usuarios.find(
        u => u.slug === perfilParam || u.id === perfilParam || u.nome.toLowerCase().includes(perfilParam.toLowerCase())
      );
      if (usuarioEncontrado) {
        setCartaoPerfilAberto(usuarioEncontrado);
      }
    }
  }, [propostas, usuarios]);

  // Carrega a proposta pública pela URL amigável (/proposta-<slug>) ou pelo link legado (?token=)
  useEffect(() => {
    if (!rotaPublica) return;
    const lerJson = async (res: Response) => {
      const tipo = res.headers.get('content-type') || '';
      if (!res.ok || !tipo.includes('application/json')) return null;
      return res.json();
    };

    // Identidade visual da agência (endpoint público)
    fetch('/api/config')
      .then(lerJson)
      .then(data => {
        if (data && data.nomeAgencia) {
          setConfig(prev => ({
            ...prev,
            ...data,
            capa: { ...prev.capa, ...(data.capa || {}) },
            fundadores: { ...prev.fundadores, ...(data.fundadores || {}) },
            premiacao: { ...prev.premiacao, ...(data.premiacao || {}) },
            time: { ...prev.time, ...(data.time || {}) },
            servicosInstitucionais: data.servicosInstitucionais || prev.servicosInstitucionais,
            clientesApresentados: data.clientesApresentados || prev.clientesApresentados,
            secoesOrdem: Array.isArray(data.secoesOrdem) && data.secoesOrdem.length > 0 ? data.secoesOrdem : prev.secoesOrdem,
          }));
        }
      })
      .catch(() => {});

    const rota = rotaPublica.tipo === 'slug'
      ? `/api/proposta/slug/${encodeURIComponent(rotaPublica.valor)}`
      : `/api/proposta/token/${encodeURIComponent(rotaPublica.valor)}`;

    const buscarLocal = () =>
      propostas.find(p => rotaPublica.tipo === 'slug' ? p.slug === rotaPublica.valor : p.token === rotaPublica.valor);

    fetch(rota)
      .then(lerJson)
      .then(prop => prop && prop.id ? prop : buscarLocal())
      .catch(() => buscarLocal())
      .then(prop => {
        if (prop) {
          setPropostaSelecionada(prop);
          setStatusPublico('ok');
          document.title = `${prop.titulo} • ${prop.clienteEmpresa}`;
        } else {
          setStatusPublico('nao_encontrada');
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotaPublica]);

  // Persistência local (cache)
  useEffect(() => { localStorage.setItem('gc_usuarios', JSON.stringify(usuarios)); }, [usuarios]);
  useEffect(() => { localStorage.setItem('gc_propostas', JSON.stringify(propostas)); }, [propostas]);
  useEffect(() => { localStorage.setItem('gc_config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('gc_logs', JSON.stringify(logs)); }, [logs]);

  // Registrar auditoria persistindo no MySQL e no estado local
  const registrarLog = (acao: LogAuditoria['acao'], detalhes: string, proposta?: Proposta, statusSeguranca: LogAuditoria['statusSeguranca'] = 'OK') => {
    const novoLog: LogAuditoria = {
      id: `log_${Date.now()}`,
      propostaId: proposta?.id,
      propostaTitulo: proposta?.titulo,
      usuarioNome: `${usuarioAtual.nome} (${usuarioAtual.papel.toUpperCase()})`,
      acao,
      detalhes,
      ip: '127.0.0.1',
      userAgent: navigator.userAgent,
      dataHora: new Date().toISOString(),
      statusSeguranca,
    };
    setLogs(prev => [novoLog, ...prev]);

    // Enviar para o banco de dados MySQL
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoLog)
    }).catch(() => {});
  };

  // Login com API backend
  const handleLogin = async (email: string, senha: string): Promise<{ success: boolean; error?: string; reinstalar?: boolean }> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const userAutenticado: Usuario = {
          id: data.usuario.id || 'usr_admin',
          nome: data.usuario.nome || 'Administrador',
          email: data.usuario.email,
          whatsapp: data.usuario.whatsapp || '',
          cargo: data.usuario.cargo || 'Diretor Geral',
          slug: data.usuario.slug || 'admin',
          papel: (data.usuario.papel as any) || 'admin',
          status: 'ativo',
          podeCriarSecoes: true,
        };

        setIsLogado(true);
        setUsuarioAtual(userAutenticado);
        localStorage.setItem('is_logado', 'true');
        localStorage.setItem('gc_usuario_logado', JSON.stringify(userAutenticado));
        localStorage.setItem('gc_usuario_atual_id', userAutenticado.id);
        setModoAtual('admin');
        registrarLog('ATIVACAO', `Login efetuado com sucesso no painel por ${userAutenticado.nome}.`);
        return { success: true };
      } else {
        // Fallback para desenvolvimento local caso o servidor backend não esteja acessível
        const userLocal = usuarios.find(u => u.email === email && u.senha === senha);
        if (userLocal) {
          setIsLogado(true);
          setUsuarioAtual(userLocal);
          localStorage.setItem('is_logado', 'true');
          setModoAtual('admin');
          return { success: true };
        }
        return { success: false, error: data.error || 'Credenciais inválidas.', reinstalar: data.reinstalar };
      }
    } catch (err: any) {
      // Fallback em caso de erro de conexão
      const userLocal = usuarios.find(u => u.email === email && u.senha === senha);
      if (userLocal) {
        setIsLogado(true);
        setUsuarioAtual(userLocal);
        localStorage.setItem('is_logado', 'true');
        setModoAtual('admin');
        return { success: true };
      }
      return { success: false, error: 'Falha de comunicação com o servidor: ' + (err.message || 'Verifique se o Node.js está em execução.') };
    }
  };

  // Concluir Instalação
  const handleConcluirInstalacao = (novoEstado?: EstadoInstalacao) => {
    setInstalado(true);
    localStorage.setItem('sistema_instalado', 'true');
    if (novoEstado) setEstadoInstalacao(novoEstado);
    setModoAtual('admin');
  };

  // Logout: limpa a sessão e volta para a tela de login
  const handleLogout = () => {
    registrarLog('DESATIVACAO', `Logout efetuado por ${usuarioAtual.nome}.`);
    localStorage.removeItem('is_logado');
    localStorage.removeItem('gc_usuario_logado');
    localStorage.removeItem('gc_usuario_atual_id');
    setIsLogado(false);
    setModoAtual('admin');
    window.history.replaceState(null, '', '/login');
  };

  const handleAbrirPerfil = () => {
    setCartaoPerfilAberto(usuarioAtual);
  };

  // Operações de Propostas conectadas ao MySQL
  const handleSalvarProposta = (propostaRecebida: Proposta) => {
    // Garante a URL amigável (/proposta-<slug>) para toda proposta salva
    const propostaSalva: Proposta = propostaRecebida.slug
      ? propostaRecebida
      : { ...propostaRecebida, slug: gerarSlugUnico(propostaRecebida.clienteEmpresa || propostaRecebida.clienteNome, propostas, propostaRecebida.id) };
    const existe = propostas.some(p => p.id === propostaSalva.id);
    let novas: Proposta[];
    if (existe) {
      novas = propostas.map(p => p.id === propostaSalva.id ? propostaSalva : p);
      registrarLog('EDICAO', `Proposta "${propostaSalva.titulo}" atualizada por ${usuarioAtual.nome}.`, propostaSalva, 'OK');
    } else {
      novas = [propostaSalva, ...propostas];
      registrarLog('CRIACAO', `Nova proposta comercial criada por ${usuarioAtual.nome}.`, propostaSalva, 'OK');
    }
    setPropostas(novas);
    setPropostaSelecionada(propostaSalva);
    setModoAtual('admin');

    // Persistência direta no MySQL
    fetch('/api/propostas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(propostaSalva)
    }).catch(err => console.error('Erro ao salvar proposta no MySQL:', err));
  };

  const handleAlternarStatus = (id: string, novoStatus: StatusProposta) => {
    let propostaAlterada: Proposta | null = null;
    const novas = propostas.map(p => {
      if (p.id === id) {
        const atualizada = { ...p, status: novoStatus, atualizadoEm: new Date().toISOString() };
        propostaAlterada = atualizada;
        registrarLog(novoStatus === 'ativo' ? 'ATIVACAO' : 'DESATIVACAO', `Status da proposta alterado para ${novoStatus.toUpperCase()}.`, atualizada, 'OK');
        return atualizada;
      }
      return p;
    });
    setPropostas(novas);
    const selecionadaAtual = novas.find(p => p.id === propostaSelecionada.id);
    if (selecionadaAtual) setPropostaSelecionada(selecionadaAtual);

    if (propostaAlterada) {
      fetch('/api/propostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propostaAlterada)
      }).catch(err => console.error('Erro ao atualizar status no MySQL:', err));
    }
  };

  const handleExcluirProposta = (id: string) => {
    const removida = propostas.find(p => p.id === id);
    if (removida) {
      registrarLog('EXCLUSAO', `Proposta "${removida.titulo}" removida pelo usuário ${usuarioAtual.nome}.`, removida, 'ALERTA');
    }
    const novas = propostas.filter(p => p.id !== id);
    setPropostas(novas);
    if (propostaSelecionada.id === id && novas.length > 0) {
      setPropostaSelecionada(novas[0]);
    }

    // Exclusão no MySQL
    fetch(`/api/propostas/${id}`, {
      method: 'DELETE'
    }).catch(err => console.error('Erro ao excluir proposta no MySQL:', err));
  };

  // Propostas antigas (sem slug) recebem a URL amigável na primeira vez que forem compartilhadas
  const handleGarantirSlug = (proposta: Proposta): Proposta => {
    if (proposta.slug) return proposta;
    const atualizada: Proposta = {
      ...proposta,
      slug: gerarSlugUnico(proposta.clienteEmpresa || proposta.clienteNome, propostas, proposta.id),
    };
    setPropostas(prev => prev.map(p => (p.id === atualizada.id ? atualizada : p)));
    if (propostaSelecionada?.id === atualizada.id) setPropostaSelecionada(atualizada);
    fetch('/api/propostas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(atualizada)
    }).catch(err => console.error('Erro ao salvar URL da proposta no MySQL:', err));
    return atualizada;
  };

  const handleAceitarProposta = (nomeResponsavel: string, documento: string) => {
    const atualizada: Proposta = {
      ...propostaSelecionada,
      status: 'aceito',
      aceiteData: new Date().toISOString(),
      aceiteResponsavel: `${nomeResponsavel} (${documento})`,
      atualizadoEm: new Date().toISOString(),
    };
    handleSalvarProposta(atualizada);
    registrarLog('ACEITE_CLIENTE', `Proposta aceita formalmente por ${nomeResponsavel}.`, atualizada, 'OK');
  };

  const handleRegistrarEnvioEmail = (proposta: Proposta, email: string, assunto: string) => {
    const novaNotificacao: NotificacaoEmail = {
      id: `email_${Date.now()}`,
      propostaId: proposta.id,
      propostaTitulo: proposta.titulo,
      destinatarioNome: proposta.clienteNome,
      destinatarioEmail: email,
      assunto,
      corpo: `Notificação enviada com sucesso para ${email}`,
      statusEnvio: 'entregue',
      dataEnvio: new Date().toISOString(),
      tokenProposta: proposta.token,
    };
    setNotificacoesEmail(prev => [novaNotificacao, ...prev]);
    registrarLog('ENVIO_EMAIL', `Notificação enviada para ${email} via SMTP cPanel.`, proposta, 'OK');
  };

  const handleSalvarConfig = (novaConfig: ConfiguracaoFixa) => {
    setConfig(novaConfig);
    registrarLog('EDICAO', 'Configurações centrais da agência atualizadas.');

    // Persistência no MySQL
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaConfig)
    }).catch(err => console.error('Erro ao salvar configurações no MySQL:', err));
  };

  const handleSalvarUsuario = (usuarioSalvo: Usuario) => {
    const existe = usuarios.some(u => u.id === usuarioSalvo.id);
    const novos = existe ? usuarios.map(u => u.id === usuarioSalvo.id ? usuarioSalvo : u) : [...usuarios, usuarioSalvo];
    setUsuarios(novos);
    if (usuarioAtual.id === usuarioSalvo.id) setUsuarioAtual(usuarioSalvo);
    registrarLog('EDICAO', `Credenciais do usuário "${usuarioSalvo.nome}" salvas.`);

    // Persistência no MySQL (o servidor valida e-mail duplicado e gera o hash da senha)
    fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuarioSalvo)
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.erro || data.error || 'Falha ao salvar usuário no banco.');
        // Recarrega a lista real do banco
        const lista = await fetch('/api/usuarios').then(r => (r.ok ? r.json() : null)).catch(() => null);
        if (Array.isArray(lista) && lista.length > 0) setUsuarios(lista);
      })
      .catch(err => {
        console.error('Erro ao salvar usuário no MySQL:', err);
        alert('Não foi possível salvar o usuário no banco de dados: ' + err.message);
      });
  };

  const handleAlternarStatusUsuario = (id: string, novoStatus: 'ativo' | 'bloqueado') => {
    let userAlterado: Usuario | null = null;
    const novos = usuarios.map(u => {
      if (u.id === id) {
        const at = { ...u, status: novoStatus };
        userAlterado = at;
        return at;
      }
      return u;
    });
    setUsuarios(novos);

    if (userAlterado) {
      fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userAlterado)
      }).catch(err => console.error('Erro ao atualizar status do usuário no MySQL:', err));
    }
  };

  const botaoTema = (
    <button
      type="button"
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 shadow-md hover:scale-105 transition-transform backdrop-blur-sm"
      title={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );

  // PÁGINA PÚBLICA DO CLIENTE: sem login, sem menu, sem barras do sistema
  // Rota pública de redefinição de senha
  if (window.location.pathname.replace(/\/+$/, '').endsWith('/redefinir-senha')) {
    return <RedefinirSenhaPage />;
  }

  // Cartão digital público (/u/<slug>)
  if (slugCartaoPublico) {
    const u = cartaoPublico;
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-white">
        {cartaoPublicoStatus === 'carregando' && <Loader2 className="w-6 h-6 animate-spin text-purple-500" />}
        {cartaoPublicoStatus === 'nao_encontrado' && <p className="text-sm text-zinc-400">Cartão não encontrado.</p>}
        {u && (
          <div className="bg-zinc-900 p-6 rounded-3xl max-w-md w-full border border-zinc-800 text-center space-y-4">
            {u.fotoUrl
              ? <img src={u.fotoUrl} alt={u.nome} className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-purple-500" />
              : <div className="w-24 h-24 rounded-full mx-auto bg-purple-600 flex items-center justify-center text-3xl font-black">{u.nome.slice(0, 1).toUpperCase()}</div>}
            <h1 className="text-xl font-bold">{u.nome}</h1>
            <p className="text-xs text-amber-400">{u.cargo || 'Consultor Comercial'}</p>
            {config.nomeAgencia && <p className="text-xs text-zinc-400">{config.nomeAgencia}</p>}
            <div className="p-4 bg-zinc-800 rounded-2xl text-xs text-left space-y-2">
              {u.whatsapp && (
                <a href={`https://wa.me/${u.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                  <Phone className="w-4 h-4 text-emerald-400" /><span>{u.whatsapp}</span>
                </a>
              )}
              <a href={`mailto:${u.email}`} className="flex items-center gap-2 hover:underline">
                <Mail className="w-4 h-4 text-blue-400" /><span>{u.email}</span>
              </a>
            </div>
            <button onClick={() => baixarVCard(u)} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Salvar Contato
            </button>
          </div>
        )}
      </div>
    );
  }

  if (rotaPublica) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
        {statusPublico === 'carregando' && (
          <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-sm text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            Carregando proposta...
          </div>
        )}
        {statusPublico === 'nao_encontrada' && (
          <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="fixed top-3 right-4 z-50">{botaoTema}</div>
            <FileX className="w-10 h-10 text-zinc-400" />
            <h1 className="text-xl font-bold">Proposta não encontrada</h1>
            <p className="text-sm text-zinc-500 max-w-sm">
              O link pode estar incorreto ou a proposta foi removida. Entre em contato com {config.nomeAgencia || 'a agência'} para receber um novo link.
            </p>
          </div>
        )}
        {statusPublico === 'ok' && (
          <ClientProposalView
            proposta={propostaSelecionada}
            config={config}
            onAceitarProposta={handleAceitarProposta}
            acaoTopoDireita={botaoTema}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* 1. SE NÃO ESTIVER INSTALADO: MOSTRA ASSISTENTE DE INSTALAÇÃO */}
      {!instalado ? (
        <SystemInstallerPage
          estadoInstalacao={{ ...estadoInstalacao, instalado: false }}
          config={config}
          onConcluirInstalacao={handleConcluirInstalacao}
          onIrParaPainel={() => setModoAtual('admin')}
        />
      ) : !isLogado ? (
        /* 2. SE NÃO ESTIVER LOGADO: TELA DE LOGIN OBRIGATÓRIA */
        <LoginPage
          onLogin={handleLogin}
        />
      ) : (
        /* 3. SISTEMA PRINCIPAL (ADMINISTRATIVO OU PORTAL DO CLIENTE) */
        <>
          {/* BARRA SUPERIOR DE NAVEGAÇÃO */}
          {isLogado && (
            <Navbar
              modoAtual={modoAtual}
              setModoAtual={setModoAtual}
              propostas={propostas}
              propostaSelecionada={propostaSelecionada}
              setPropostaSelecionada={setPropostaSelecionada}
              config={config}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onNovaProposta={() => setModoAtual('criar_proposta')}
              usuarioAtual={usuarioAtual}
              onLogout={handleLogout}
              onAbrirPerfil={handleAbrirPerfil}
            />
          )}

          {/* ÁREA DE CONTEÚDO PRINCIPAL */}
          <div className="flex-1 pb-16">
            
            {/* PORTAL DO CLIENTE */}
            {modoAtual === 'cliente' && (
              <ClientProposalView
                proposta={propostaSelecionada}
                config={config}
                onVoltarParaPainel={() => setModoAtual('admin')}
                onAceitarProposta={handleAceitarProposta}
              />
            )}

            {/* DASHBOARD ADMINISTRATIVO */}
            {isLogado && modoAtual === 'admin' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminDashboard
                  propostas={propostas}
                  config={config}
                  usuarioAtual={usuarioAtual}
                  usuarios={usuarios}
                  onNavegarCriar={() => setModoAtual('criar_proposta')}
                  onNavegarEditar={(prop) => {
                    setPropostaEmEdicao(prop);
                    setModoAtual('editar_proposta');
                  }}
                  onAlternarStatus={handleAlternarStatus}
                  onExcluirProposta={handleExcluirProposta}
                  onGarantirSlug={handleGarantirSlug}
                  onRegistrarEnvioEmail={handleRegistrarEnvioEmail}
                  onAbrirGerenciadorUsuarios={() => setUserModalAberto(true)}
                />
              </div>
            )}

            {/* CRIAR PROPOSTA */}
            {isLogado && modoAtual === 'criar_proposta' && (
              <ProposalFormPage
                propostaInicial={null}
                config={config}
                usuarioAtual={usuarioAtual}
                onSalvar={handleSalvarProposta}
                onVoltar={() => setModoAtual('admin')}
                propostasExistentes={propostas}
              />
            )}

            {/* EDITAR PROPOSTA */}
            {isLogado && modoAtual === 'editar_proposta' && (
              <ProposalFormPage
                propostaInicial={propostaEmEdicao || propostaSelecionada}
                config={config}
                usuarioAtual={usuarioAtual}
                onSalvar={handleSalvarProposta}
                onVoltar={() => setModoAtual('admin')}
                propostasExistentes={propostas}
              />
            )}

            {/* CMS / EDITOR ELEMENTOR */}
            {isLogado && modoAtual === 'cms' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CmsConfigEditor
                  config={config}
                  onSalvarConfig={handleSalvarConfig}
                  propostas={propostas}
                  onAtualizarPropostaEspecifica={handleSalvarProposta}
                />
              </div>
            )}

            {/* CONFIGURAÇÃO DA AGÊNCIA */}
            {isLogado && modoAtual === 'agencia' && (
              <AgencySettingsPage
                config={config}
                onSalvarConfig={handleSalvarConfig}
                onVisualizarProposta={() => setModoAtual('cliente')}
              />
            )}

            {/* AUDITORIA SIEM */}
            {isLogado && modoAtual === 'seguranca' && (
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SecurityLogs
                  logs={logs}
                  onLimparLogs={() => setLogs([])}
                />
              </div>
            )}

            {/* KIT CPANEL */}
            {isLogado && modoAtual === 'cpanel' && (
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CpanelDeploymentKit />
              </div>
            )}

            {/* INSTALADOR (CASO ACESSADO VIA MENU) */}
            {isLogado && modoAtual === 'instalador' && (
              <SystemInstallerPage
                estadoInstalacao={{ ...estadoInstalacao, instalado: true }}
                config={config}
                onConcluirInstalacao={handleConcluirInstalacao}
                      onIrParaPainel={() => setModoAtual('admin')}
              />
            )}

          </div>

        </>
      )}

      {/* MODAL DE USUÁRIOS */}
      {userModalAberto && (
        <UserManagementModal
          usuarios={usuarios}
          usuarioAtual={usuarioAtual}
          onSalvarUsuario={handleSalvarUsuario}
          onAlternarStatusUsuario={handleAlternarStatusUsuario}
          onFechar={() => setUserModalAberto(false)}
        />
      )}

      {/* MODAL CARTÃO DE CONTATO */}
      {cartaoPerfilAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-zinc-900 text-white p-6 rounded-3xl max-w-md w-full border border-zinc-800 text-center space-y-4">
            <button
              onClick={() => setCartaoPerfilAberto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-xl font-bold">{cartaoPerfilAberto.nome}</h3>
            <p className="text-xs text-amber-400">{cartaoPerfilAberto.cargo || 'Consultor Comercial'}</p>
            <div className="p-4 bg-zinc-800 rounded-2xl text-xs text-left space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>{cartaoPerfilAberto.whatsapp}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>{cartaoPerfilAberto.email}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => baixarVCard(cartaoPerfilAberto)}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Salvar Contato
              </button>
              <button
                onClick={() => setCartaoPerfilAberto(null)}
                className="py-2 px-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
