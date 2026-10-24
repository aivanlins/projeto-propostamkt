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
import { Phone, Mail, X, Download } from 'lucide-react';
import { Navbar, ModoVisualizacao } from './components/Navbar';
import { ClientProposalView } from './components/ClientView/ClientProposalView';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { ProposalFormPage } from './components/Admin/ProposalFormPage';
import { CmsConfigEditor } from './components/Admin/CmsConfigEditor';
import { SystemInstallerPage } from './components/Installer/SystemInstallerPage';
import { SecurityLogs } from './components/Admin/SecurityLogs';
import { CpanelDeploymentKit } from './components/DeploymentKit/CpanelDeploymentKit';
import { SimulationBar } from './components/SimulationBar';
import { UserManagementModal } from './components/Admin/UserManagementModal';
import { AgencySettingsPage } from './components/Admin/AgencySettingsPage';
import { LoginPage } from './components/Auth/LoginPage';
import { baixarVCard } from './utils/security';

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
  const [isAcessoDiretoCliente, setIsAcessoDiretoCliente] = useState<boolean>(false);
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

  // Checagem de token público de cliente via URL (?token=...) conectado à API do MySQL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      // Tenta buscar diretamente do backend MySQL para garantir dados em tempo real
      fetch(`/api/proposta/token/${tokenParam}`)
        .then(res => res.json())
        .then(propReal => {
          if (propReal && propReal.id) {
            setPropostaSelecionada(propReal);
            setModoAtual('cliente');
            setIsAcessoDiretoCliente(true);
          } else {
            const encontrada = propostas.find(p => p.token === tokenParam);
            if (encontrada) {
              setPropostaSelecionada(encontrada);
              setModoAtual('cliente');
              setIsAcessoDiretoCliente(true);
            }
          }
        })
        .catch(() => {
          const encontrada = propostas.find(p => p.token === tokenParam);
          if (encontrada) {
            setPropostaSelecionada(encontrada);
            setModoAtual('cliente');
            setIsAcessoDiretoCliente(true);
          }
        });
    }

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

  // Resetar Instalação
  const handleResetarInstalacao = async () => {
    try {
      await fetch('/api/reset-install', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('sistema_instalado');
    localStorage.removeItem('is_logado');
    localStorage.removeItem('gc_usuario_logado');
    setInstalado(false);
    setIsLogado(false);
    setModoAtual('instalador');
  };

  // Operações de Propostas conectadas ao MySQL
  const handleSalvarProposta = (propostaSalva: Proposta) => {
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

  const handleVisualizarComoCliente = (proposta: Proposta) => {
    setPropostaSelecionada(proposta);
    setModoAtual('cliente');
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

    // Persistência no MySQL
    fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuarioSalvo)
    }).catch(err => console.error('Erro ao salvar usuário no MySQL:', err));
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

  const esconderBarrasSistema = isAcessoDiretoCliente && modoAtual === 'cliente';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* 1. SE NÃO ESTIVER INSTALADO: MOSTRA ASSISTENTE DE INSTALAÇÃO */}
      {!instalado ? (
        <SystemInstallerPage
          estadoInstalacao={{ ...estadoInstalacao, instalado: false }}
          config={config}
          onConcluirInstalacao={handleConcluirInstalacao}
          onResetarInstalacaoParaTestes={handleResetarInstalacao}
          onIrParaPainel={() => setModoAtual('admin')}
        />
      ) : !isLogado && !isAcessoDiretoCliente ? (
        /* 2. SE NÃO ESTIVER LOGADO (E NÃO FOR CLIENTE COM TOKEN): TELA DE LOGIN OBRIGATÓRIA */
        <LoginPage
          onLogin={handleLogin}
          onResetarInstalacao={handleResetarInstalacao}
        />
      ) : (
        /* 3. SISTEMA PRINCIPAL (ADMINISTRATIVO OU PORTAL DO CLIENTE) */
        <>
          {/* BARRA SUPERIOR DE NAVEGAÇÃO */}
          {!esconderBarrasSistema && (
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
            />
          )}

          {/* ÁREA DE CONTEÚDO PRINCIPAL */}
          <div className="flex-1 pb-16">
            
            {/* PORTAL DO CLIENTE */}
            {modoAtual === 'cliente' && (
              <ClientProposalView
                proposta={propostaSelecionada}
                config={config}
                onVoltarParaPainel={() => {
                  setIsAcessoDiretoCliente(false);
                  setModoAtual('admin');
                }}
                onSimularAtivacao={() => {}}
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
                  onVisualizarComoCliente={handleVisualizarComoCliente}
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
                onResetarInstalacaoParaTestes={handleResetarInstalacao}
                onIrParaPainel={() => setModoAtual('admin')}
              />
            )}

          </div>

          {/* BARRA DE TESTES & CONTROLE (ADMIN) */}
          {isLogado && !esconderBarrasSistema && (
            <SimulationBar
              propostaAtual={propostaSelecionada}
              onSelecionarPorStatus={() => {}}
              onExpirarImediatamente={() => {}}
              onRenovarValidade={() => {}}
              usuarioAtual={usuarioAtual}
              usuarios={usuarios}
              onTrocarUsuario={u => setUsuarioAtual(u)}
            />
          )}
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
